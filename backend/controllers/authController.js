import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

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
		console.error('Registration error:', error);
		return res.status(500).json({ message: 'Registration failed', error: error.message });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		console.log(`🔐 Login attempt for: ${email}`);

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			console.log(`❌ User not found: ${email}`);
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			console.log(`❌ Invalid password for: ${email}`);
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		if (user.role === 'LANDLORD' && !user.isApproved) {
			console.log(`⚠️ Pending approval for landlord: ${email}`);
			return res.status(403).json({ message: 'Your Landlord account registration is pending Admin approval.' });
		}

		const token = signToken(user.id, user.role);
		console.log(`✅ Login successful: ${email}`);
		
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
		console.error('Login error:', error);
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

		// Check if user exists
		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Prevent admins from deleting their own account from the dashboard
		if (req.user?.id === id) {
			return res.status(400).json({ message: 'You cannot delete your own account while logged in. Ask another admin to remove you.' });
		}

		// Delete all properties owned by the user first (cascade delete)
		await prisma.property.deleteMany({
			where: { landlordId: id }
		});

		// Then delete the user
		await prisma.user.delete({ where: { id } });

		return res.status(200).json({ 
			message: 'User and associated properties deleted successfully',
			deletedUser: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role
			}
		});
	} catch (error) {
		console.error('Delete user error:', error);
		return res.status(500).json({ message: 'Failed to delete user', error: error.message });
	}
};

export { 
  register, 
  login, 
  getAllUsers, 
  updateUser, 
  deleteUser, 
  getPendingLandlords, 
  approveLandlord 
};