'use client'

import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Star, Send, Sparkles, MessageSquare } from 'lucide-react'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  name: z.string().max(80).optional(),
  email: z.string().email({ message: 'Please enter a valid email' }),
  category: z.enum(['Bug', 'Feature Request', 'General', 'Praise']),
  message: z.string().min(10, { message: 'At least 10 characters' }).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
})

export default function FeedbackPage() {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState<number>(0)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      category: 'General',
      message: '',
      rating: undefined,
    },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, rating: rating || undefined }),
      })
      if (!res.ok && res.status !== 202) throw new Error('Request failed')
      toast({ title: 'Thank you!', description: 'Your feedback helps us improve.' })
      form.reset({ name: '', email: '', category: 'General', message: '', rating: undefined })
      setRating(0)
    } catch (e) {
      toast({ title: 'Something went wrong', description: 'Please try again later.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background relative overflow-x-clip">
      <Header />

      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/30 via-indigo-500/30 to-cyan-500/30 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute -bottom-24 left-1/3 h-[360px] w-[620px] rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 blur-3xl"
        />
      </div>

      <section className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-28 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight"
          >
            We value your feedback
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-3 text-muted-foreground text-base sm:text-lg"
          >
            Tell us what you love, what needs polish, or ideas that would make HideMyBrowser even better.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5 sm:p-8 shadow-xl"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-medium">Share your thoughts</h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Bug">Bug</SelectItem>
                            <SelectItem value="Feature Request">Feature Request</SelectItem>
                            <SelectItem value="Praise">Praise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Rating</span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const value = i + 1
                        const active = value <= rating
                        return (
                          <motion.button
                            key={value}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRating(value)}
                            className={`rounded-lg p-2 transition-colors ${active ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`}
                            aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                          >
                            <Star className={`h-5 w-5 ${active ? 'fill-yellow-500/30' : ''}`} />
                          </motion.button>
                        )
                      })}
                      {rating > 0 && (
                        <motion.span
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-2 text-sm text-muted-foreground"
                        >
                          {rating}/5
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder="Share details, steps to reproduce, or your ideas..." {...field} />
                      </FormControl>
                      <FormDescription>Be as detailed as you like. We read every submission.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>Thank you for helping improve HideMyBrowser</span>
                  </div>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    <Send className="h-4 w-4" />
                    {submitting ? 'Sending...' : 'Send feedback'}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
