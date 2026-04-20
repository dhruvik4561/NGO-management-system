import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Campaign } from '../models/Campaign.js'
import { Donation } from '../models/Donation.js'
import { makeInvoiceId } from '../utils/ids.js'
import { buildInvoiceEmailHtml } from '../utils/invoiceMail.js'
import { sendMail } from '../config/mailer.js'

const router = Router()

router.get('/me', requireAuth, async (req, res) => {
  try {
    const list = await Donation.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('campaignId', 'title slug')
      .lean()
    return res.json({
      donations: list.map((d) => ({
        id: String(d._id),
        invoiceId: d.invoiceId,
        amount: d.amount,
        currency: d.currency,
        frequency: d.frequency,
        paymentMethod: d.paymentMethod,
        status: d.status,
        createdAt: d.createdAt,
        campaign: d.campaignId
          ? { title: d.campaignId.title, slug: d.campaignId.slug }
          : null,
      })),
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load donations' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const campaignId = String(req.body.campaignId || '').trim()
    const amount = Number(req.body.amount)
    const frequency = req.body.frequency === 'monthly' ? 'monthly' : 'once'
    const paymentMethod = String(req.body.paymentMethod || 'card')
    const pm = ['card', 'upi', 'netbanking', 'wallet'].includes(paymentMethod)
      ? paymentMethod
      : 'card'

    if (!campaignId || !Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ message: 'Valid campaign and amount are required' })
    }

    const campaign = await Campaign.findOne({ _id: campaignId, isActive: true })
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or inactive' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (campaign.goalAmount > 0) {
      if (campaign.raisedAmount >= campaign.goalAmount) {
        return res.status(400).json({ message: 'Campaign has already reached its fully funded goal! Thank you!' })
      }
      if (campaign.raisedAmount + amount > campaign.goalAmount) {
        const remaining = campaign.goalAmount - campaign.raisedAmount
        return res.status(400).json({ message: `This donation exceeds the limit. Only ₹${remaining} left to reach our goal!` })
      }
    }

    const invoiceId = makeInvoiceId()
    const donation = await Donation.create({
      invoiceId,
      userId: user._id,
      campaignId: campaign._id,
      amount,
      currency: 'INR',
      frequency,
      paymentMethod: pm,
      status: 'completed',
      donorSnapshot: { name: user.name, email: user.email },
    })

    campaign.raisedAmount += amount;
    await campaign.save();

    const paidAt = new Date(donation.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    try {
      const html = buildInvoiceEmailHtml({
        invoiceId,
        donorName: user.name,
        donorEmail: user.email,
        campaignTitle: campaign.title,
        amount,
        currency: 'INR',
        frequency,
        paymentMethod: pm,
        paidAt,
      })
      await sendMail({
        to: user.email,
        subject: `Donation receipt ${invoiceId}`,
        text: `Thank you. Invoice ${invoiceId} for INR ${amount} to ${campaign.title}.`,
        html,
      })
    } catch (mailErr) {
      console.error('Invoice email failed', mailErr)
    }

    return res.status(201).json({
      donation: {
        id: String(donation._id),
        invoiceId: donation.invoiceId,
        amount: donation.amount,
        currency: donation.currency,
        frequency: donation.frequency,
        paymentMethod: donation.paymentMethod,
        status: donation.status,
        campaignTitle: campaign.title,
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Payment could not be completed' })
  }
})

export default router
