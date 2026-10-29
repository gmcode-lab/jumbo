export const TRENDING = [
  'large language models',
  'climate change',
  'protein folding',
  'quantum computing',
]

export const SAMPLE_PAPERS = [
  {
    id: 'demo-1',
    title: 'Attention Is All You Need',
    abstract:
      'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. The model generalizes well to other tasks such as English constituency parsing.',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'],
    published: '2017-06-12',
    pdf_url: 'https://arxiv.org/pdf/1706.03762',
    source: 'arXiv',
  },
  {
    id: 'demo-2',
    title: 'Highly Accurate Protein Structure Prediction with AlphaFold',
    abstract:
      'Proteins are essential to life, and understanding their structure can facilitate a mechanistic understanding of their function. Here we provide the first computational method that can regularly predict protein structures with atomic accuracy even where no similar structure is known. This validated neural network model is a major advance for structural biology.',
    authors: ['John Jumper', 'Richard Evans', 'Alexander Pritzel'],
    published: '2021-07-15',
    pdf_url: 'https://doi.org/10.1038/s41586-021-03819-2',
    source: 'Crossref',
  },
  {
    id: 'demo-3',
    title: 'Deep Residual Learning for Image Recognition',
    abstract:
      'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We provide comprehensive evidence showing that these residual networks are easier to optimize and gain accuracy from considerably increased depth.',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
    published: '2015-12-10',
    pdf_url: 'https://arxiv.org/pdf/1512.03385',
    source: 'arXiv',
  },
  {
    id: 'demo-4',
    title: 'Climate Change and the Future of Global Food Security',
    abstract:
      'Rising temperatures and shifting rainfall patterns threaten crop yields worldwide. We review evidence from field studies and models on how warming affects major staple crops. Adaptation strategies such as new crop varieties and better water management can reduce, but not eliminate, the projected losses.',
    authors: ['Maria Lopez', 'David Chen'],
    published: '2020-03-02',
    pdf_url: 'https://doi.org/10.0000/demo-climate',
    source: 'Crossref',
  },
]

const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean)

// Fake "AI" summary built from the abstract, in the same format as the real one
export function demoSummary(paper) {
  const s = sentences(paper.abstract)
  const tldr = s[0] || paper.title
  const ideas = (s.slice(1, 4).length ? s.slice(1, 4) : [paper.title])
    .map((x) => `- ${x}`)
    .join('\n')
  return `TL;DR: ${tldr}

Key Ideas:
${ideas}

Why It Matters: This work helps researchers and curious readers understand a key idea in the field. (Demo mode: sample output, not real AI.)

Difficulty: Intermediate`
}

export function demoAnswer(question) {
  return `(Demo mode) You asked: "${question}". Once the Nebius AI key is connected, Jumbo will answer this using the paper's abstract.`
}