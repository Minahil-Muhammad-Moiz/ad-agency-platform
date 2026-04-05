import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const schema = z.object({
  clientName: z.string().min(1),
  industry: z.string().min(1),
  website: z.string().url(),
  competitors: z.string(),
  objective: z.enum(['awareness', 'consideration', 'conversion']),
  targetAudience: z.string().min(1),
  budget: z.number().positive(),
  tone: z.string().min(1),
  imageryStyle: z.string().min(1),
  colorDirection: z.string().min(1),
  dos: z.string(),
  donts: z.string(),
});

const BriefBuilder = () => {
  const [step, setStep] = useState(1);
  const [aiOutput, setAiOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/generate/copy', {
        product: data.clientName,
        tone: data.tone,
        platform: 'All Platforms',
        word_limit: 200
      });
      setAiOutput(response.data);
      setStep(5);
    } catch (error) {
      toast.error('Failed to generate AI response');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const element = document.getElementById('ai-output');
    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save('campaign-brief.pdf');
    });
  };

  // Render steps 1-4 forms here
  return (
    <div className="p-6">
      {/* Multi-step form implementation */}
    </div>
  );
};