const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Client = require('../models/Client');

// GET /api/clients
// - a regular user always sees exactly their own client profile (created
//   automatically on registration, but re-created here defensively)
// - a dietitian sees the clients assigned to them
// - an admin sees every client
const getClients = asyncHandler(async (req, res) => {
  if (req.user.role === 'user') {
    let client = await Client.findOne({ user: req.user._id });
    if (!client) {
      client = await Client.create({ user: req.user._id, name: req.user.name });
    }
    return res.json({ clients: [client] });
  }

  if (req.user.role === 'dietitian') {
    const clients = await Client.find({ dietitian: req.user._id }).populate('user', 'name email');
    return res.json({ clients });
  }

  // admin
  const clients = await Client.find().populate('user', 'name email').populate('dietitian', 'name email');
  res.json({ clients });
});

// GET /api/clients/:id
const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).populate('user', 'name email');
  if (!client) throw new ApiError(404, 'Client not found');
  assertClientAccess(req.user, client);
  res.json({ client });
});

// PUT /api/clients/:id  — update targets, preferences, or (re)assign a dietitian
const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');
  assertClientAccess(req.user, client);

  const { targetCalories, macroTargets, dietaryPreferences, dietitian } = req.body;
  if (targetCalories !== undefined) client.targetCalories = targetCalories;
  if (macroTargets !== undefined) client.macroTargets = { ...client.macroTargets, ...macroTargets };
  if (dietaryPreferences !== undefined) client.dietaryPreferences = dietaryPreferences;

  // Only a dietitian claiming an unassigned client, or an admin, may set `dietitian`
  if (dietitian !== undefined) {
    if (req.user.role === 'admin') {
      client.dietitian = dietitian || null;
    } else if (req.user.role === 'dietitian' && !client.dietitian) {
      client.dietitian = req.user._id;
    } else {
      throw new ApiError(403, 'You cannot reassign this client');
    }
  }

  await client.save();
  res.json({ client });
});

// DELETE /api/clients/:id — admin only (see routes)
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');
  await client.deleteOne();
  res.json({ message: 'Client deleted' });
});

function assertClientAccess(user, client) {
  if (user.role === 'admin') return;
  if (user.role === 'user' && String(client.user) === String(user._id)) return;
  if (user.role === 'dietitian' && String(client.dietitian) === String(user._id)) return;
  throw new ApiError(403, 'You do not have access to this client');
}

module.exports = { getClients, getClientById, updateClient, deleteClient, assertClientAccess };
