import express from "express"
import nodemailer from "nodemailer"
import bodyParser from "body-parser"
import cors from "cors"

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post("/send-feedback-email", async (req, res) => {
  const { feature, rating, comments, userEmail } = req.body

  if (!feature || !rating || !comments || !userEmail) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try {
    // Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "goalgetters69420@gmail.com", 
        pass: "pejcwjmkodbnjdvu",           
      },
    })

    // Email content
    const mailOptions = {
      from: "goalgetters69420@gmail.com",
      to: userEmail, 
      subject: "🎯 GoalGetters Feedback Received",
      text: `
Thank you for your feedback!

Feature: ${feature}
Rating: ${rating}
Comments: ${comments}

— GoalGetters Team
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log('nodemailer info:', info)
    res.status(200).json({ message: "Email sent successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to send email", details: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`SMTP server running on http://localhost:${PORT}`))
