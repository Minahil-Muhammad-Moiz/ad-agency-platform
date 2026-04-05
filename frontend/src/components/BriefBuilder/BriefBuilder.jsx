import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ChevronLeft, ChevronRight, Download, Sparkles, Check, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

// Form validation schema
const briefSchema = z.object({
  // Step 1: Client Details
  clientName: z.string().min(1, 'Client name is required'),
  industry: z.string().min(1, 'Industry is required'),
  website: z.string().url('Must be a valid URL'),
  competitors: z.string().min(1, 'At least one competitor is required'),
  
  // Step 2: Campaign Objective
  objective: z.enum(['awareness', 'consideration', 'conversion'], {
    required_error: 'Please select an objective'
  }),
  targetAudience: z.string().min(1, 'Target audience is required'),
  budget: z.number().min(1000, 'Minimum budget is $1,000').max(1000000, 'Maximum budget is $1,000,000'),
  
  // Step 3: Creative Preferences
  tone: z.string().min(1, 'Tone is required'),
  imageryStyle: z.string().min(1, 'Imagery style is required'),
  colorDirection: z.string().min(1, 'Color direction is required'),
  dos: z.string().optional(),
  donts: z.string().optional(),
});

const BriefBuilder = () => {
  const [step, setStep] = useState(1);
  const [aiResponse, setAiResponse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState(null);

  const { register, handleSubmit, watch, formState: { errors }, trigger, getValues } = useForm({
    resolver: zodResolver(briefSchema),
    defaultValues: {
      objective: 'awareness',
      budget: 50000
    }
  });

  const objectives = [
    { value: 'awareness', label: 'Brand Awareness', icon: '👁️', description: 'Increase brand visibility and reach' },
    { value: 'consideration', label: 'Consideration', icon: '🤔', description: 'Drive engagement and interest' },
    { value: 'conversion', label: 'Conversion', icon: '💰', description: 'Generate sales and leads' }
  ];

  const tones = [
    'Professional', 'Playful', 'Emotional', 'Urgent', 'Luxury', 'Minimalist', 'Bold', 'Friendly'
  ];

  const imageryStyles = [
    'Photography', 'Illustration', '3D Render', 'Minimalist', 'Abstract', 'Lifestyle', 'Product Focus'
  ];

  // Handle next step
  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (step === 1) fieldsToValidate = ['clientName', 'industry', 'website', 'competitors'];
    if (step === 2) fieldsToValidate = ['objective', 'targetAudience', 'budget'];
    if (step === 3) fieldsToValidate = ['tone', 'imageryStyle', 'colorDirection'];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  // Handle previous step
  const prevStep = () => {
    setStep(step - 1);
  };

  // Generate AI brief
  const generateBrief = async (data) => {
    setIsGenerating(true);
    setFormData(data);
    
    try {
      // Call AI service for copy generation
      const copyResponse = await axios.post('http://localhost:3001/generate/copy', {
        product: data.clientName,
        tone: data.tone,
        platform: 'All Platforms',
        word_limit: 150
      });
      
      // Generate social captions
      const socialResponse = await axios.post('http://localhost:3001/generate/social', {
        platform: 'Instagram & Facebook',
        campaign_goal: data.objective,
        brand_voice: data.tone
      });
      
      // Generate hashtags
      const hashtagResponse = await axios.post('http://localhost:3001/generate/hashtags', {
        content: `${data.clientName} ${data.industry} campaign`,
        industry: data.industry
      });
      
      // Combine AI responses
      setAiResponse({
        campaignTitle: `${data.clientName} ${data.objective === 'awareness' ? 'Awareness' : data.objective === 'consideration' ? 'Engagement' : 'Conversion'} Campaign`,
        headlines: [
          copyResponse.data.headline,
          `Discover the new ${data.clientName} experience`,
          `Transform your ${data.industry} journey today`
        ],
        toneGuide: data.tone,
        channels: {
          'Social Media': data.objective === 'awareness' ? 40 : 30,
          'Search Ads': 25,
          'Display Network': 20,
          'Email Marketing': 15
        },
        visualDirection: `${data.imageryStyle} style featuring ${data.targetAudience.split(',')[0]} in authentic, ${data.tone.toLowerCase()} settings with ${data.colorDirection} color palette`,
        socialCaptions: socialResponse.data.captions || [
          `✨ Exciting news from ${data.clientName}!`,
          `🚀 Big things are happening!`,
          `💫 Experience the difference`,
          `🎯 Your journey starts here`,
          `🌟 Join the movement today`
        ],
        hashtags: hashtagResponse.data.hashtags || [
          `#${data.clientName.replace(/ /g, '')}`, `#${data.industry}`, '#Marketing', '#DigitalAgency'
        ]
      });
      
      setStep(5);
      toast.success('AI brief generated successfully!');
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback mock response
      setAiResponse({
        campaignTitle: `${data.clientName} ${data.objective} Campaign 2024`,
        headlines: [
          `Transform Your ${data.industry} Experience`,
          `Discover the Future of ${data.industry}`,
          `Unlock New Possibilities with ${data.clientName}`
        ],
        toneGuide: data.tone,
        channels: {
          'Social Media': 35,
          'Google Ads': 30,
          'Email Marketing': 20,
          'Influencer Collaboration': 15
        },
        visualDirection: `${data.imageryStyle} visuals with ${data.colorDirection} color scheme, featuring authentic ${data.targetAudience} scenarios`,
        socialCaptions: [
          `🚀 Launching something amazing at ${data.clientName}!`,
          `✨ Ready to revolutionize your ${data.industry} experience?`,
          `💫 Your journey starts here with ${data.clientName}`,
          `🎯 Join us as we redefine ${data.industry}`,
          `🌟 Be part of something extraordinary`
        ],
        hashtags: [`#${data.clientName.replace(/ /g, '')}`, `#${data.industry}`, '#Innovation', '#Marketing', '#DigitalTransformation']
      });
      setStep(5);
      toast.success('AI brief generated (demo mode)');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    const element = document.getElementById('ai-brief-output');
    if (!element) return;
    
    toast.loading('Generating PDF...', { id: 'pdf' });
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${formData?.clientName}_creative_brief.pdf`);
      toast.success('PDF downloaded!', { id: 'pdf' });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

  // Step 1: Client Details
  const Step1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Client Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client Name *
          </label>
          <input {...register('clientName')} className="input-field" placeholder="e.g., Lumiere Skincare" />
          {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Industry *
          </label>
          <input {...register('industry')} className="input-field" placeholder="e.g., Beauty & Cosmetics" />
          {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website *
          </label>
          <input {...register('website')} className="input-field" placeholder="https://example.com" />
          {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Key Competitors *
          </label>
          <input {...register('competitors')} className="input-field" placeholder="e.g., Brand A, Brand B" />
          {errors.competitors && <p className="text-red-500 text-xs mt-1">{errors.competitors.message}</p>}
        </div>
      </div>
    </div>
  );

  // Step 2: Campaign Objective
  const Step2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Objective</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Primary Objective *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {objectives.map(obj => (
            <label key={obj.value} className="cursor-pointer">
              <input
                type="radio"
                value={obj.value}
                {...register('objective')}
                className="hidden peer"
              />
              <div className="p-4 border-2 rounded-lg peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 hover:border-gray-400 transition-all">
                <div className="text-2xl mb-2">{obj.icon}</div>
                <div className="font-semibold">{obj.label}</div>
                <div className="text-sm text-gray-500 mt-1">{obj.description}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.objective && <p className="text-red-500 text-xs mt-1">{errors.objective.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Audience *
        </label>
        <textarea
          {...register('targetAudience')}
          rows={3}
          className="input-field"
          placeholder="e.g., Women 25-40, health-conscious, urban professionals, interested in clean beauty"
        />
        {errors.targetAudience && <p className="text-red-500 text-xs mt-1">{errors.targetAudience.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Budget (USD) *
        </label>
        <input
          {...register('budget', { valueAsNumber: true })}
          type="number"
          className="input-field"
          placeholder="e.g., 50000"
        />
        {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget.message}</p>}
      </div>
    </div>
  );

  // Step 3: Creative Preferences
  const Step3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Creative Preferences</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tone of Voice *
        </label>
        <select {...register('tone')} className="input-field">
          <option value="">Select tone...</option>
          {tones.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.tone && <p className="text-red-500 text-xs mt-1">{errors.tone.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Imagery Style *
        </label>
        <select {...register('imageryStyle')} className="input-field">
          <option value="">Select style...</option>
          {imageryStyles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.imageryStyle && <p className="text-red-500 text-xs mt-1">{errors.imageryStyle.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color Direction *
        </label>
        <input {...register('colorDirection')} className="input-field" placeholder="e.g., Warm earth tones with gold accents" />
        {errors.colorDirection && <p className="text-red-500 text-xs mt-1">{errors.colorDirection.message}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Do's
          </label>
          <textarea {...register('dos')} rows={3} className="input-field" placeholder="What should be included?" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Don'ts
          </label>
          <textarea {...register('donts')} rows={3} className="input-field" placeholder="What should be avoided?" />
        </div>
      </div>
    </div>
  );

  // Step 4: Review & Submit
  const Step4 = () => {
    const values = getValues();
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Review Your Brief</h3>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium">{values.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Industry</p>
              <p className="font-medium">{values.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Objective</p>
              <p className="font-medium capitalize">{values.objective}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="font-medium">${values.budget?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tone</p>
              <p className="font-medium">{values.tone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Imagery Style</p>
              <p className="font-medium">{values.imageryStyle}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Target Audience</p>
            <p className="font-medium">{values.targetAudience}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Color Direction</p>
            <p className="font-medium">{values.colorDirection}</p>
          </div>
        </div>
        
        <button
          onClick={handleSubmit(generateBrief)}
          disabled={isGenerating}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader className="animate-spin" size={20} />
              Generating AI Brief...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate AI Creative Brief
            </>
          )}
        </button>
      </div>
    );
  };

  // Step 5: AI Output Display
  const Step5 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Generated Creative Brief</h3>
        <button onClick={exportToPDF} className="btn-primary flex items-center gap-2">
          <Download size={18} />
          Export PDF
        </button>
      </div>
      
      <div id="ai-brief-output" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
          <h2 className="text-2xl font-bold">{aiResponse?.campaignTitle}</h2>
          <p className="mt-2 opacity-90">Generated by AI • Creative Brief</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Campaign Title & Headlines */}
          <div>
            <h4 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-3">Campaign Headlines</h4>
            <ul className="space-y-2">
              {aiResponse?.headlines?.map((headline, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check size={18} className="text-green-500 mt-0.5" />
                  <span>{headline}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Tone Guide */}
          <div>
            <h4 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-3">Tone of Voice Guide</h4>
            <p className="text-gray-700 dark:text-gray-300">{aiResponse?.toneGuide}</p>
          </div>
          
          {/* Channel Allocation */}
          <div>
            <h4 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-3">Recommended Channels</h4>
            <div className="space-y-2">
              {Object.entries(aiResponse?.channels || {}).map(([channel, percentage]) => (
                <div key={channel}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{channel}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Visual Direction */}
          <div>
            <h4 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-3">Key Visual Direction</h4>
            <p className="text-gray-700 dark:text-gray-300">{aiResponse?.visualDirection}</p>
          </div>
          
          {/* Social Captions */}
          <div>
            <h4 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-3">Social Media Captions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiResponse?.socialCaptions?.slice(0, 5).map((caption, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm">"{caption}"</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hashtags */}
          <div>
            <h4 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-3">Recommended Hashtags</h4>
            <div className="flex flex-wrap gap-2">
              {aiResponse?.hashtags?.slice(0, 10).map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => {
          setStep(1);
          setAiResponse(null);
        }}
        className="w-full btn-primary bg-gray-500 hover:bg-gray-600"
      >
        Create Another Brief
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Progress Steps */}
      {step !== 5 && (
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 relative">
                <div className={`h-2 ${s <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'} rounded-full`} />
                <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
                  s <= step ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {s < step ? <Check size={16} /> : s}
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                  {s === 1 && 'Client'}
                  {s === 2 && 'Objective'}
                  {s === 3 && 'Creative'}
                  {s === 4 && 'Review'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Form Steps */}
      <div className="card p-8">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
        {step === 5 && <Step5 />}
        
        {/* Navigation Buttons */}
        {step !== 5 && step !== 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {step > 1 && (
              <button onClick={prevStep} className="flex items-center gap-2 px-6 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <ChevronLeft size={18} />
                Previous
              </button>
            )}
            <button onClick={nextStep} className="btn-primary flex items-center gap-2 ml-auto">
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BriefBuilder;