import express from 'express';
import { AuthService } from './auth.service';
import { Role } from '../../auth.stub';

const router = express.Router();
const authService = new AuthService();

// Register endpoint (for Sprint 1). Includes a PRAZ vendor verification stub.
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, displayName, prazVendorNumber } = req.body;

    // Simple validation
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password and role are required' });
    }

    // PRAZ vendor check stub (Sprint 1): in later sprints call PRAZ API or verification service
    if (role === Role.PRAZ_Regulator && !prazVendorNumber) {
      // PRAZ_Regulator role must have a vendor number in this prototype
      return res.status(400).json({ error: 'prazVendorNumber required for PRAZ_Regulator in prototype' });
    }

    const user = await authService.register(email, password, role, displayName, prazVendorNumber);
    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await authService.validateUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = authService.generateJwt(user);
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
