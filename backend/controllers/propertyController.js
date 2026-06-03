import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const allowedRoles = ['TENANT', 'LANDLORD', 'ADMIN'];

const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
};

const isAdmin = (user) => user?.role === 'ADMIN';

const canManageProperty = (user, property) => {
  return isAdmin(user) || property.landlordId === user.id;
};

const canViewUnpublishedProperty = (user, property) => {
	return isAdmin(user) || property.landlordId === user.id;
};

// @desc    Create a new property listing (Landlords Only)
// @route   POST /api/properties
const createProperty = async (req, res) => {
  try {
    const { title, description, price, location } = req.body;
    const parsedPrice = Number(price);

    if (!title || !description || price === undefined || !location) {
      return res.status(400).json({ message: 'All listing fields are required' });
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const images = Array.isArray(req.imageUrls)
      ? req.imageUrls.filter((url) => typeof url === 'string' && url.startsWith('https://'))
      : [];

    const property = await prisma.property.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        location: location.trim(),
        images: JSON.stringify(images),
        isPublished: true,
        landlordId: req.user.id,
      },
    });

    res.status(201).json({ message: 'Property created successfully', property: { ...property, images } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create listing', error: error.message });
  }
};

// @desc    Get all properties for open catalog
// @route   GET /api/properties
const getAllProperties = async (req, res) => {
  try {
    if (!req.user?.role) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const userRole = req.user.role?.toUpperCase();
    
    // LANDLORD and ADMIN can see everything (all listings)
    // TENANT can only see published listings
    const whereClause = (userRole === 'ADMIN' || userRole === 'LANDLORD')
      ? {}
      : { isPublished: true };

    const properties = await prisma.property.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        landlord: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    const normalizedProperties = (Array.isArray(properties) ? properties : []).map((property) => ({
      ...property,
      images: parseImages(property.images),
    }));
    return res.status(200).json(normalizedProperties);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve listings', error: error.message });
  }
};

// @desc    Get a single property listing
// @route   GET /api/properties/:id
const getPropertyById = async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.isPublished && !canViewUnpublishedProperty(req.user, property)) {
		return res.status(404).json({ message: 'Property not found' });
	}

    return res.json({ ...property, images: parseImages(property.images) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve listing', error: error.message });
  }
};

// @desc    Update a property listing
// @route   PUT /api/properties/:id
const updateProperty = async (req, res) => {
  try {
    const existingProperty = await prisma.property.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!canManageProperty(req.user, existingProperty)) {
      return res.status(403).json({ message: 'Forbidden: you can only modify your own listings' });
    }

    const { title, description, price, location, isPublished } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: 'Title cannot be empty' });
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) return res.status(400).json({ message: 'Description cannot be empty' });
      updates.description = description.trim();
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: 'Price must be a valid positive number' });
      }
      updates.price = parsedPrice;
    }

    if (location !== undefined) {
      if (!location.trim()) return res.status(400).json({ message: 'Location cannot be empty' });
      updates.location = location.trim();
    }

    if (Array.isArray(req.imageUrls) && req.imageUrls.length > 0) {
      updates.images = JSON.stringify(req.imageUrls.filter((url) => typeof url === 'string' && url.startsWith('https://')));
    }

    if (isPublished !== undefined) {
    if (typeof isPublished === 'string') {
      updates.isPublished = isPublished === 'true';
    } else if (typeof isPublished === 'boolean') {
      updates.isPublished = isPublished;
    } else {
      return res.status(400).json({ message: 'isPublished must be a boolean value' });
    }
  }

    const updatedProperty = await prisma.property.update({
      where: { id: req.params.id },
      data: updates,
    });

    return res.json({ message: 'Property updated successfully', property: { ...updatedProperty, images: parseImages(updatedProperty.images) } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update listing', error: error.message });
  }
};

// @desc    Delete a property listing
// @route   DELETE /api/properties/:id
const deleteProperty = async (req, res) => {
  try {
    const existingProperty = await prisma.property.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!canManageProperty(req.user, existingProperty)) {
      return res.status(403).json({ message: 'Forbidden: you can only delete your own listings' });
    }

    await prisma.property.delete({
      where: { id: req.params.id },
    });

    return res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete listing', error: error.message });
  }
};

export { createProperty, getAllProperties, getPropertyById, updateProperty, deleteProperty };