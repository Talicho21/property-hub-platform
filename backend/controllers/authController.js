import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const signToken = (userId, role) =>
	jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
	try {
		const { name, email, password, role } = req.body;
		const allowedRoles = ['TENANT', 'LANDLORD'];
		const selectedRole = role || 'TENANT';

		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Name, email and password are required' });
		}

		if (!allowedRoles.includes(selectedRole)) {
			return res.status(400).json({ message: 'Invalid registration role selected' });
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return res.status(409).json({ message: 'Email is already registered' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: selectedRole,
				isApproved: selectedRole === 'LANDLORD' ? false : true,
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isApproved: true,
			},
		});

		if (user.role === 'LANDLORD') {
			return res.status(201).json({
				message: 'Registration successful. Your landlord account is pending admin approval.',
				user,
			});
		}

		const token = signToken(user.id, user.role);
		return res.status(201).json({ message: 'Registration successful', token, user });
	} catch (error) {
		return res.status(500).json({ message: 'Registration failed', error: error.message });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		if (user.role === 'LANDLORD' && !user.isApproved) {
			return res.status(403).json({ message: 'Your Landlord account registration is pending Admin approval.' });
		}

		const token = signToken(user.id, user.role);
		return res.status(200).json({
			message: 'Login successful',
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				isApproved: user.isApproved,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: 'Login failed', error: error.message });
	}
};

const getPendingLandlords = async (req, res) => {
	try {
		const pendingLandlords = await prisma.user.findMany({
			where: {
				role: 'LANDLORD',
				isApproved: false,
			},
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isApproved: true,
				createdAt: true,
			},
		});

		return res.status(200).json(pendingLandlords);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to retrieve pending landlords', error: error.message });
	}
};

const approveLandlord = async (req, res) => {
	try {
		const { id } = req.params;

		const landlord = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isApproved: true,
			},
		});

		if (!landlord || landlord.role !== 'LANDLORD') {
			return res.status(404).json({ message: 'Landlord not found' });
		}

		const updatedLandlord = await prisma.user.update({
			where: { id },
			data: { isApproved: true },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isApproved: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return res.status(200).json({ message: 'Landlord approved successfully', landlord: updatedLandlord });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to approve landlord', error: error.message });
	}
};

const getAllUsers = async (req, res) => {
	try {
		const users = await prisma.user.findMany({
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isApproved: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return res.json(users);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
	}
};

const updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, role, isApproved } = req.body;
		const user = await prisma.user.update({
			where: { id },
			data: { name, role, isApproved },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				isApproved: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		return res.status(200).json({ message: 'User updated successfully', user });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update user', error: error.message });
	}
};

const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;
		await prisma.user.delete({ where: { id } });
		return res.status(200).json({ message: 'User deleted successfully' });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to delete user', error: error.message });
	}
};

export { register, login, getAllUsers, updateUser, deleteUser, getPendingLandlords, approveLandlord };
