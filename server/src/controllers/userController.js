const User = require('../models/User');
const Resource = require('../models/Resource');
const { USER_ROLES, RESOURCE_STATUS } = require('../utils/constants');

/**
 * @desc    Admin: Get all registered users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, department } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Update user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (![USER_ROLES.STUDENT, USER_ROLES.ADMIN].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Get all resources (including pending and rejected)
 * @route   GET /api/admin/resources
 * @access  Private (Admin only)
 */
const getAllAdminResources = async (req, res, next) => {
  try {
    const { status, search, department, resourceType } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { subject: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (resourceType && resourceType !== 'All') {
      query.resourceType = resourceType;
    }

    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email department year')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Get system statistics for dashboard
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalResources,
      pendingResources,
      approvedResources,
      rejectedResources,
      downloadAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: USER_ROLES.STUDENT }),
      User.countDocuments({ role: USER_ROLES.ADMIN }),
      Resource.countDocuments(),
      Resource.countDocuments({ status: RESOURCE_STATUS.PENDING }),
      Resource.countDocuments({ status: RESOURCE_STATUS.APPROVED }),
      Resource.countDocuments({ status: RESOURCE_STATUS.REJECTED }),
      Resource.aggregate([
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' }, totalViews: { $sum: '$viewsCount' } } },
      ]),
    ]);

    const stats = {
      totalUsers,
      totalStudents,
      totalAdmins,
      totalResources,
      pendingResources,
      approvedResources,
      rejectedResources,
      totalDownloads: downloadAgg[0]?.totalDownloads || 0,
      totalViews: downloadAgg[0]?.totalViews || 0,
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllAdminResources,
  getAdminStats,
};
