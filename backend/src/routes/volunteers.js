import { Router } from 'express'
import { VolunteerApplication } from '../models/VolunteerApplication.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/apply', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const phone = String(req.body.phone || '').trim()
    const interest = String(req.body.interest || '').trim()
    const message = String(req.body.message || '').trim()
    const kind = req.body.kind === 'internship' ? 'internship' : 'volunteer'
    const eventId = req.body.eventId || null

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' })
    }

    await VolunteerApplication.create({
      name,
      email,
      phone,
      interest,
      message,
      kind,
      eventId,
    })

    return res.status(201).json({ message: 'Thank you — we will contact you soon.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not submit application' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const list = await VolunteerApplication.find({ email: req.userEmail })
      .sort({ createdAt: -1 })
      .populate('eventId', 'title')
      .lean()
    return res.json({
      applications: list.map((a) => ({
        id: String(a._id),
        name: a.name,
        email: a.email,
        phone: a.phone,
        interest: a.interest,
        message: a.message,
        kind: a.kind,
        status: a.status,
        event: a.eventId ? { id: String(a.eventId._id), title: a.eventId.title } : null,
        createdAt: a.createdAt,
      })),
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load applications' })
  }
})

export default router
