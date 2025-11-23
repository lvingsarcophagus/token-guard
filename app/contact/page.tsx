'use client'

import React from 'react'
import { useForm, ValidationError } from '@formspree/react'
import { ChevronRight, Mail, Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/navbar'

function ContactForm() {
  const [state, handleSubmit] = useForm('meovqnpq')

  if (state.succeeded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="border border-white/30 bg-black/60 p-8 backdrop-blur-xl text-center">
            <div className="w-16 h-16 bg-white/10 border border-white/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white font-mono tracking-wider mb-3">
              MESSAGE SENT
            </h2>
            <p className="text-white/70 font-mono text-sm mb-6">
              Thank you for contacting us! We'll get back to you within 24-48 hours.
            </p>
            <a 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border border-white font-mono text-xs hover:bg-transparent hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO HOME
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white pt-20">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-[10px] font-mono tracking-wider">SUPPORT</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold font-mono tracking-wider mb-4 text-white">
            CONTACT US
          </h1>
          <p className="text-white/60 font-mono text-sm leading-relaxed">
            Have questions, feedback, or need assistance? Get in touch with our team. We typically respond within 24-48 hours.
          </p>
        </div>

        {/* Contact Form */}
        <div className="border border-white/20 bg-black/60 backdrop-blur-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-white font-mono text-xs tracking-wider mb-3">
                FULL NAME
              </label>
              <input
                id="name"
                type="text"
                name="name"
                required
                placeholder="Your name"
                className="w-full bg-black/80 border border-white/20 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-white/50 transition-colors"
              />
              <ValidationError prefix="Name" field="name" errors={state.errors} />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-white font-mono text-xs tracking-wider mb-3">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full bg-black/80 border border-white/20 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-white/50 transition-colors"
              />
              <ValidationError prefix="Email" field="email" errors={state.errors} />
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-white font-mono text-xs tracking-wider mb-3">
                SUBJECT
              </label>
              <input
                id="subject"
                type="text"
                name="subject"
                required
                placeholder="What's this about?"
                className="w-full bg-black/80 border border-white/20 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-white/50 transition-colors"
              />
              <ValidationError prefix="Subject" field="subject" errors={state.errors} />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-white font-mono text-xs tracking-wider mb-3">
                MESSAGE
              </label>
              <textarea
                id="message"
                name="message"
                required
                placeholder="Tell us more..."
                rows={6}
                className="w-full bg-black/80 border border-white/20 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-white/50 transition-colors resize-none"
              />
              <ValidationError prefix="Message" field="message" errors={state.errors} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={state.submitting}
              className="w-full px-6 py-4 bg-white text-black hover:bg-transparent hover:text-white border-2 border-white font-mono text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
            >
              {state.submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  SENDING...
                </>
              ) : (
                <>
                  SEND MESSAGE
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Email */}
          <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 border border-white/30 bg-white/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-mono text-sm tracking-wider">EMAIL</h3>
            </div>
            <a
              href="mailto:nayanjoshymaniyathjoshy@gmail.com"
              className="text-white/70 hover:text-white font-mono text-xs break-all transition-colors"
            >
              nayanjoshymaniyathjoshy@gmail.com
            </a>
          </div>

          {/* Response Time */}
          <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 border border-white/30 bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-mono text-sm tracking-wider">RESPONSE TIME</h3>
            </div>
            <p className="text-white/60 font-mono text-xs">
              We typically respond within 24-48 hours during business days.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-black mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-white/40 font-mono text-xs">
            © 2025 TOKENOMICS LAB. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
      </div>
    </>
  )
}

export default ContactForm
