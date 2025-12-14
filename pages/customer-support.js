import React, { useState } from 'react';
import Head from 'next/head';
import { useUser } from '../lib/userContext';
import { useRouter } from 'next/router';

export default function CustomerSupport() {
  const { user } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    email: user?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const subjectOptions = [
    { value: '', label: 'Select a subject...' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'location-services', label: 'Location Services' },
    { value: 'technical-support', label: 'Technical Support' },
    { value: 'account-issues', label: 'Account Issues' },
    { value: 'tournament-questions', label: 'Tournament Questions' },
    { value: 'billing', label: 'Billing' },
    { value: 'general-inquiry', label: 'General Inquiry' },
    { value: 'bug-report', label: 'Bug Report' },
    { value: 'feature-request', label: 'Feature Request' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Here you would typically send the data to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus({ type: 'success', message: 'Your message has been sent successfully! We\'ll get back to you soon.' });
      setFormData({
        subject: '',
        message: '',
        email: user?.email || ''
      });
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <>
      <Head>
        <title>Customer Support - TopDog.dog</title>
        <meta name="description" content="Get help and support from TopDog.dog customer service team" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Customer Support</h1>
            <p className="text-gray-600 mt-2">We're here to help! Send us a message and we'll get back to you as soon as possible.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject Dropdown */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please describe your issue or question in detail..."
                  required
                />
              </div>

              {/* Submit Status */}
              {submitStatus && (
                <div className={`p-4 rounded-md ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {submitStatus.message}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>

            {/* Additional Support Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Ways to Get Help</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">FAQ</h4>
                  <p className="text-gray-600 text-sm">Check our frequently asked questions for quick answers to common issues.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Help Center</h4>
                  <p className="text-gray-600 text-sm">Browse our comprehensive help articles and tutorials.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
