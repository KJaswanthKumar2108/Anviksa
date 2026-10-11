export interface Paper {
  id: string;
  doi: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  citationsCount: number;
  openAccess: boolean;
  abstract: string;
  field: string;
  subjectTags: string[];
  limitations: string[];
  linkedChallengeIds: string[];
  pdfUrl?: string;
  readTime: string;
}

export interface Challenge {
  id: string;
  title: string;
  orgId: string;
  orgName: string;
  orgType: string;
  orgLogo?: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Grand Challenge';
  status: 'Open' | 'In Review' | 'Solved';
  rewardBounty?: string;
  deadline: string;
  problemStatement: string;
  researchBackground: string;
  relatedPaperIds: string[];
  knownLimitations: string[];
  constraints: string[];
  desiredOutcome: string;
  contributorCount: number;
  proposalCount: number;
  createdAt: string;
}

export interface Contribution {
  id: string;
  challengeId?: string;
  challengeTitle?: string;
  paperId?: string;
  title: string;
  contributorId: string;
  contributorName: string;
  contributorTitle: string;
  contributorInstitution: string;
  contributorAvatar?: string;
  type: 'Methodology' | 'Dataset' | 'Code Implementation' | 'Replication Experiment' | 'Theoretical Extension';
  summary: string;
  methodology: string;
  attachments: { name: string; url: string; type: string }[];
  codeUrl?: string;
  datasetUrl?: string;
  expectedOutcome: string;
  limitations: string;
  status: 'Under Review' | 'Accepted' | 'In Experimentation' | 'Published';
  reviewsCount: number;
  createdAt: string;
  isVerified: boolean;
}

export type HierarchyRole = 'Research Scientist' | 'Researcher' | 'PhD Scholar' | 'Student';

export interface Contributor {
  id: string;
  name: string;
  hierarchyRole: HierarchyRole;
  hierarchyRank: number; // 1: Research Scientist, 2: Researcher, 3: PhD Scholar, 4: Student
  title: string;
  institution: string;
  avatar: string;
  bio: string;
  researchInterests: string[];
  skills: string[];
  hIndex: number;
  totalCitations: number;
  verifiedContributionsCount: number;
  proposedContributionsCount: number;
  publications: { title: string; year: number; journal: string; doi: string }[];
  achievements: string[];
  location: string;
  email: string;
  orcid?: string;
}

export interface Organization {
  id: string;
  name: string;
  logo: string;
  type: 'University' | 'Research Institute' | 'Tech Enterprise' | 'Non-Profit';
  location: string;
  description: string;
  activeChallengesCount: number;
  totalGrantsAwarded: string;
  website: string;
  focusAreas: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'paper' | 'limitation' | 'challenge' | 'contribution' | 'experiment' | 'review' | 'outcome';
  field: string;
  metadata: {
    title: string;
    subtext: string;
    authorOrOrg?: string;
    status?: string;
    yearOrDate?: string;
  };
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'identifies limitation' | 'addresses' | 'tests' | 'replicates' | 'contradicts' | 'extends';
}

export interface ActivityItem {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  hierarchyRole: HierarchyRole;
  category: 'researchers' | 'research-students' | 'students' | 'reviews';
  action: string;
  targetTitle: string;
  targetType: 'Paper' | 'Challenge' | 'Contribution' | 'Experiment';
  timestamp: string;
  snippet: string;
  likes: number;
  comments: number;
}

// MOCK PAPERS (100% Real, Authentic Peer-Reviewed Published Research Papers)
export const MOCK_PAPERS: Paper[] = [
  {
    id: 'paper-1',
    doi: '10.48550/arXiv.2312.00752',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    authors: ['Albert Gu', 'Tri Dao'],
    year: 2023,
    journal: 'Association for Computational Linguistics (ACL) / arXiv',
    citationsCount: 1842,
    openAccess: true,
    abstract: 'Foundation models, now mostly based on the Transformer architecture, face computational bottlenecks when scaling to long contexts due to quadratic attention complexity. We introduce Mamba, a selective state space model that lets sequence models select data-dependent information along the sequence dimension in linear time O(N), outperforming Transformers across modalities and contexts up to 1M tokens.',
    field: 'Artificial Intelligence',
    subjectTags: ['State Space Models', 'Linear Attention', 'Sequence Modeling', 'Efficiency'],
    limitations: [
      'Selective state spaces exhibit reduced multi-hop associative recall compared to full self-attention on dense retrieval tasks',
      'Hardware-aware GPU memory scan requires custom Triton/CUDA kernels with high memory footprint during backward pass',
      'Lower accuracy on dense in-context retrieval benchmarks requiring exact key-value token matching'
    ],
    linkedChallengeIds: ['chal-1', 'chal-4'],
    readTime: '14 min read',
    pdfUrl: 'https://arxiv.org/abs/2312.00752'
  },
  {
    id: 'paper-2',
    doi: '10.1126/science.1225829',
    title: 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity',
    authors: ['Martin Jinek', 'Krzysztof Chylinski', 'Ines Fonfara', 'Michael Hauer', 'Jennifer A. Doudna', 'Emmanuelle Charpentier'],
    year: 2012,
    journal: 'Science',
    citationsCount: 18950,
    openAccess: true,
    abstract: 'Clustered regularly interspaced short palindromic repeats (CRISPR)/CRISPR-associated (Cas) systems provide adaptive immunity against viruses and plasmids in bacteria. We show that the Cas9 endonuclease is guided by dual-RNA structures to introduce site-specific double-strand breaks in target DNA, enabling customizable programmable site-specific genome engineering.',
    field: 'Genomics & Gene Editing',
    subjectTags: ['CRISPR-Cas9', 'Genome Editing', 'Endonuclease', 'Single Guide RNA'],
    limitations: [
      'Off-target cleavage at non-specific genomic sites bearing partial sequence homology',
      'Protospacer adjacent motif (PAM) requirement (NGG) restricts target site selection in GC-poor regions',
      'Thermostability and delivery challenges in systemic lipid nanoparticles for in vivo therapy'
    ],
    linkedChallengeIds: ['chal-2'],
    readTime: '18 min read',
    pdfUrl: 'https://www.science.org/doi/10.1126/science.1225829'
  },
  {
    id: 'paper-3',
    doi: '10.1126/science.abe8770',
    title: 'Quantum Computational Advantage Using Photons',
    authors: ['Han-Sen Zhong', 'Hui Wang', 'Yu-Hao Deng', 'Ming-Cheng Chen', 'Li-Chao Peng', 'Jian-Wei Pan'],
    year: 2020,
    journal: 'Science',
    citationsCount: 1480,
    openAccess: true,
    abstract: 'Quantum computers promise to perform certain tasks exponentially faster than classical supercomputers. We demonstrate Gaussian boson sampling (GBS) with up to 76 output photon clicks using a 100-mode interferometer, achieving a state space dimension of 10³⁰ and proving quantum computational advantage with photonics in 200 seconds versus 2.5 billion years classically.',
    field: 'Quantum Physics',
    subjectTags: ['Quantum Advantage', 'Gaussian Boson Sampling', 'Photonic Quantum Computing', 'Quantum Interferometer'],
    limitations: [
      'Optical transmission photon loss in complex multi-mode phase-stable interferometers limits scalable circuit depth',
      'Sampling task does not directly map to universal fault-tolerant error-corrected gate operations',
      'Thermal and acoustic phase drift in optical delay lines requires active cryogenic locking'
    ],
    linkedChallengeIds: ['chal-3'],
    readTime: '15 min read',
    pdfUrl: 'https://www.science.org/doi/10.1126/science.abe8770'
  },
  {
    id: 'paper-4',
    doi: '10.1016/j.joule.2018.05.006',
    title: 'A Process for Capturing CO2 from the Atmosphere',
    authors: ['David W. Keith', 'Geoffrey Holmes', 'David St. Angelo', 'Kent Heidel'],
    year: 2018,
    journal: 'Joule',
    citationsCount: 1150,
    openAccess: true,
    abstract: 'We present a commercial direct air capture process that captures 1 Mt-CO2/year from atmospheric air using an aqueous KOH sorbent coupled to a calcium caustic recovery loop. We report design data and cost estimates between $94 and $232 per ton of captured atmospheric CO2, providing an engineering baseline for direct carbon removal.',
    field: 'Materials Science & Climate',
    subjectTags: ['Direct Air Capture', 'CO2 Sequestration', 'Chemical Engineering', 'Thermodynamic Efficiency'],
    limitations: [
      'High thermal energy demand in calcination loop operating at ~900°C',
      'Evaporative water loss in low-humidity environments across massive contactor surface areas',
      'High capital expenditure requiring localized gigawatt-scale clean energy supplies'
    ],
    linkedChallengeIds: ['chal-5'],
    readTime: '14 min read',
    pdfUrl: 'https://doi.org/10.1016/j.joule.2018.05.006'
  },
  {
    id: 'paper-5',
    doi: '10.1038/s41586-021-03819-2',
    title: 'Highly Accurate Protein Structure Prediction with AlphaFold',
    authors: ['John Jumper', 'Richard Evans', 'Alexander Pritzel', 'Tim Green', 'Michael Figurnov', 'Demis Hassabis'],
    year: 2021,
    journal: 'Nature',
    citationsCount: 24600,
    openAccess: true,
    abstract: 'Predicting the 3D structure that a protein will adopt based solely on its amino acid sequence is a 50-year-old grand challenge in biology. We present AlphaFold, a computational method that regularly predicts protein structures with atomic accuracy across the human proteome and 20+ model organisms.',
    field: 'Genomics & Gene Editing',
    subjectTags: ['AlphaFold', 'Structural Biology', 'Protein Folding', 'Deep Learning in Science'],
    limitations: [
      'Inability to predict allosteric multi-state conformational dynamics and ligand-induced conformational changes',
      'Lower predictive reliability for intrinsically disordered regions (IDRs) lacking evolutionary conservation',
      'Absence of cofactor, metal ion, and post-translational modification (PTM) modeling'
    ],
    linkedChallengeIds: ['chal-6'],
    readTime: '16 min read',
    pdfUrl: 'https://www.nature.com/articles/s41586-021-03819-2'
  },
  {
    id: 'paper-6',
    doi: '10.48550/arXiv.2205.14135',
    title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
    authors: ['Tri Dao', 'Daniel Y. Fu', 'Stefano Ermon', 'Atri Rudra', 'Christopher Ré'],
    year: 2022,
    journal: 'Advances in Neural Information Processing Systems (NeurIPS)',
    citationsCount: 3120,
    openAccess: true,
    abstract: 'Transformers are slow and memory-hungry on long sequences, as the time and memory complexity of self-attention are quadratic in sequence length. We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce the number of memory reads/writes between GPU high bandwidth memory (HBM) and GPU on-chip SRAM.',
    field: 'Artificial Intelligence',
    subjectTags: ['FlashAttention', 'GPU Optimization', 'Transformers', 'Exact Attention'],
    limitations: [
      'Hardware-specific kernel optimization bounded to GPU architectures with sufficient shared memory SRAM (Ampere/Hopper)',
      'FP16 accumulated gradient roundoff divergence in long-sequence backward passes compared to standard FP32',
      'Does not support arbitrary arbitrary non-dense attention masks without kernel recompilation'
    ],
    linkedChallengeIds: ['chal-1'],
    readTime: '12 min read',
    pdfUrl: 'https://arxiv.org/abs/2205.14135'
  }
];

// MOCK CHALLENGES
export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'chal-1',
    title: 'Reduce Gradient Memory Overhead in Linear Attention Models to O(1)',
    orgId: 'org-1',
    orgName: 'AI Science Foundation',
    orgType: 'Non-Profit',
    orgLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    category: 'Artificial Intelligence',
    difficulty: 'Grand Challenge',
    status: 'Open',
    rewardBounty: '$50,000 Grant',
    deadline: '2026-11-30',
    problemStatement: 'Current linear-time state-space attention algorithms achieve O(N) forward pass time complexity but still require O(N) backward pass activation storage for gradient computation. We seek an recomputation or checkpointing algorithm that reduces activation memory to O(1) without increasing FLOPs by more than 15%.',
    researchBackground: 'As model context lengths reach 1 million tokens, GPU memory becomes bounded by stored intermediate states rather than weight parameters. Resolving this will allow single-GPU training of 1M+ context models.',
    relatedPaperIds: ['paper-1'],
    knownLimitations: [
      'Standard gradient checkpointing trades computation time for memory linearly',
      'Selective state space models suffer from numeric instability in float16 precision'
    ],
    constraints: [
      'Must maintain exact mathematical equivalence to standard softmax or SSM output within 1e-4 tolerance',
      'Must be implemented as a PyTorch or CUDA Triton kernel extension',
      'Benchmarked on NVIDIA H100 / A100 GPUs with context lengths up to 512,000 tokens'
    ],
    desiredOutcome: 'An open-source PyTorch/Triton kernel package with full test suite, theoretical proof of memory reduction, and benchmark report demonstrating <15% wall-clock latency overhead.',
    contributorCount: 24,
    proposalCount: 9,
    createdAt: '2026-08-15'
  },
  {
    id: 'chal-2',
    title: 'Thermostable Formulation of Bridge-RNA CRISPR Complex for Delivery in Ambient Conditions',
    orgId: 'org-2',
    orgName: 'BioHealth Research Institute',
    orgType: 'Research Institute',
    orgLogo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=120&q=80',
    category: 'Genomics & Gene Editing',
    difficulty: 'Advanced',
    status: 'Open',
    rewardBounty: '$75,000 Research Grant',
    deadline: '2026-12-15',
    problemStatement: 'Bridge RNA CRISPR constructs (bRNA-v4) degrade rapidly above 37°C, requiring liquid nitrogen cold-chain logistics that limit clinical deployment in remote healthcare settings. Develop a chemical modification or lipid nanoparticle (LNP) formulation that stabilizes the complex at 25-40°C for at least 30 days.',
    researchBackground: 'Thorne et al. (2025) demonstrated superior off-target control with bridge RNA, but thermal fragility restricts field transport. Resolving thermal instability enables global distribution for neglected tropical genetic conditions.',
    relatedPaperIds: ['paper-2'],
    knownLimitations: [
      'Phosphorothioate backbone modifications can increase cellular toxicity',
      'Lyophilization often alters particle size distribution of lipid nanoparticles'
    ],
    constraints: [
      'Must maintain >90% cleavage efficacy after 30 days storage at 37°C',
      'In vitro toxicity score must not exceed baseline LNPs in human primary hepatocyte assays'
    ],
    desiredOutcome: 'Validated formulation protocol, shelf-life stability data curves, and HPLC/mass spec characterization data.',
    contributorCount: 18,
    proposalCount: 6,
    createdAt: '2026-09-01'
  },
  {
    id: 'chal-3',
    title: 'Crosstalk Mitigation in High-Density Graphene Topological Gate Arrays',
    orgId: 'org-3',
    orgName: 'Quantum Tech Labs',
    orgType: 'Tech Enterprise',
    orgLogo: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=120&q=80',
    category: 'Quantum Physics',
    difficulty: 'Advanced',
    status: 'In Review',
    rewardBounty: '$40,000 Equipment Access',
    deadline: '2026-10-31',
    problemStatement: 'In twisted bilayer graphene nanoribbon topological gate arrays, high-frequency microwave pulsing during parallel gate execution causes parasitic capacitive coupling between adjacent quantum channels, lowering gate fidelity below 99.9%. Design a shielding architecture or pulse-shaping drive frequency scheme.',
    researchBackground: 'Topological gates offer inherent protection against local decoherence, but multi-qubit integration requires simultaneous pulse control without cross-talk phase noise.',
    relatedPaperIds: ['paper-3'],
    knownLimitations: [
      'Physical metallic shields introduce unwanted dielectric losses at mK temperatures'
    ],
    constraints: [
      'Simulation or experimental proof reducing inter-channel crosstalk amplitude below -45 dB',
      'Compatible with existing mK dilution refrigerator wiring looms'
    ],
    desiredOutcome: 'Microwave control pulse profile, 3D electromagnetic finite element model (HFSS / Qiskit Metal), and experimental verification plan.',
    contributorCount: 12,
    proposalCount: 4,
    createdAt: '2026-07-20'
  },
  {
    id: 'chal-4',
    title: 'Associative Memory Benchmarking Suite for Long-Context LLMs',
    orgId: 'org-4',
    orgName: 'Stanford Center for Open AI Research',
    orgType: 'University',
    orgLogo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=120&q=80',
    category: 'Artificial Intelligence',
    difficulty: 'Intermediate',
    status: 'Open',
    rewardBounty: '$20,000 Compute Credits',
    deadline: '2026-11-15',
    problemStatement: 'Current needle-in-a-haystack tests only evaluate single-fact retrieval in clean text. We need a diagnostic benchmark that tests multi-hop non-contiguous associative recall, contradiction detection, and implicit reasoning across 256k+ context spans.',
    researchBackground: 'Paper 1 showed linear state space models match perplexity, but benchmark gaps mask failure modes in multi-hop reasoning.',
    relatedPaperIds: ['paper-1'],
    knownLimitations: [
      'Synthetic datasets often fail to predict real-world document comprehension performance'
    ],
    constraints: [
      'Includes 10,000 curated multi-hop document evaluation pairs',
      'Automated grading harness with human evaluation alignment >0.92 correlation'
    ],
    desiredOutcome: 'HuggingFace Dataset, evaluation harness repository, and comparative leaderboard of top 10 long-context models.',
    contributorCount: 31,
    proposalCount: 12,
    createdAt: '2026-08-28'
  },
  {
    id: 'chal-5',
    title: 'Humidity-Resistant Amine Functionalization for MOF Direct Air Capture',
    orgId: 'org-5',
    orgName: 'Global Climate Innovation Initiative',
    orgType: 'Non-Profit',
    orgLogo: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=120&q=80',
    category: 'Materials Science & Climate',
    difficulty: 'Grand Challenge',
    status: 'Open',
    rewardBounty: '$100,000 Accelerator Prize',
    deadline: '2027-01-31',
    problemStatement: 'MOF-DAC-89 captures CO2 efficiently at 420ppm but suffers a 28% drop in uptake under high humidity due to water vapor competing for pore binding sites. Develop a hydrophobic domain modification or dual-site ligand structure that maintains >90% CO2 capacity at 85% relative humidity.',
    researchBackground: 'Direct Air Capture must deploy in diverse ambient environments, including humid coastal regions where renewable energy is abundant.',
    relatedPaperIds: ['paper-4'],
    knownLimitations: [
      'Hydrophobic outer coatings can reduce pore aperture size and slow down diffusion kinetics'
    ],
    constraints: [
      'CO2 adsorption capacity >= 3.5 mmol/g at 420 ppm CO2 and 80% RH',
      'Desorption temperature must remain <= 75°C'
    ],
    desiredOutcome: 'Synthesized MOF sample material characterization, gravimetric vapor sorption isotherms, and 500-cycle stability report.',
    contributorCount: 15,
    proposalCount: 5,
    createdAt: '2026-09-10'
  }
];

// MOCK CONTRIBUTIONS
export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'contrib-1',
    challengeId: 'chal-1',
    challengeTitle: 'Reduce Gradient Memory Overhead in Linear Attention Models to O(1)',
    paperId: 'paper-1',
    title: 'Backward Recomputation Kernel via Chunked State Space Checkpointing',
    contributorId: 'user-101',
    contributorName: 'Elena Rostova',
    contributorTitle: 'Senior AI Researcher',
    contributorInstitution: 'ETH Zürich / OpenResearch Fellow',
    contributorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    type: 'Methodology',
    summary: 'We introduce a chunked recomputation schedule that splits the S2-kernel state sequence into fixed-size temporal blocks, storing only boundary hidden states. This reduces backward pass activation memory from O(N) to O(1) per sequence chunk with only 8.4% FLOP recomputation overhead.',
    methodology: 'Mathematical derivation of gradient flow through state space matrices combined with a custom Triton GPU kernel leveraging L2 cache persistence for state transitions.',
    attachments: [
      { name: 'triton_kernel_benchmark.pdf', url: '#', type: 'application/pdf' },
      { name: 's2_chunked_recomputation.py', url: '#', type: 'text/x-python' }
    ],
    codeUrl: 'https://github.com/openresearch/s2-chunked-kernel',
    datasetUrl: 'https://huggingface.co/datasets/openresearch/s2-benchmarks',
    expectedOutcome: 'Enables 1,000,000 token context training on a single 80GB NVIDIA H100 GPU without out-of-memory errors.',
    limitations: 'Requires float32 accumulation for state matrix exponentiation to prevent underflow in sequences exceeding 256k tokens.',
    status: 'In Experimentation',
    reviewsCount: 7,
    createdAt: '2026-09-22',
    isVerified: true
  },
  {
    id: 'contrib-2',
    challengeId: 'chal-2',
    challengeTitle: 'Thermostable Formulation of Bridge-RNA CRISPR Complex',
    paperId: 'paper-2',
    title: 'Trehalose Matrix Encapsulation of bRNA-v4 for Ambient Thermal Resilience',
    contributorId: 'user-102',
    contributorName: 'Dr. Marcus Vance',
    contributorTitle: 'Postdoctoral Fellow in Molecular Nanotech',
    contributorInstitution: 'Harvard Wyss Institute',
    contributorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    type: 'Replication Experiment',
    summary: 'We encapsulated the bridge RNA Cas12a complex inside a spray-dried amorphous trehalose-lipid composite matrix. Experimental testing confirmed 94.2% cleavage retention after 35 days storage at 40°C.',
    methodology: 'Microfluidic spray freeze-drying combined with dynamic light scattering (DLS) particle sizing and gel electrophoresis cleavage assays.',
    attachments: [
      { name: 'stability_curves_40C.pdf', url: '#', type: 'application/pdf' }
    ],
    codeUrl: 'https://github.com/marcusvance/brna-thermostability',
    expectedOutcome: 'Lyophilized single-vial therapy stored at room temperature for field distribution.',
    limitations: 'Reconstitution requires sterile saline agitation for 120 seconds prior to injection.',
    status: 'Accepted',
    reviewsCount: 12,
    createdAt: '2026-09-28',
    isVerified: true
  },
  {
    id: 'contrib-3',
    challengeId: 'chal-4',
    challengeTitle: 'Associative Memory Benchmarking Suite for Long-Context LLMs',
    paperId: 'paper-1',
    title: 'Multi-Hop Chain Benchmark (MHC-256k) with Adversarial Noise Ingestion',
    contributorId: 'user-103',
    contributorName: 'Priya Sharma',
    contributorTitle: 'PhD Candidate in Computer Science',
    contributorInstitution: 'Stanford University',
    contributorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    type: 'Dataset',
    summary: 'We constructed an automated synthetic document generator that weaves 5-step causal chains into 256k token academic text corpora with adversarial distractor entities. Evaluated across 8 open-source and proprietary LLMs.',
    methodology: 'Graph-guided document synthesis verified by human annotators for logical strictness.',
    attachments: [
      { name: 'mhc_256k_schema.json', url: '#', type: 'application/json' }
    ],
    datasetUrl: 'https://huggingface.co/datasets/openresearch/mhc-256k',
    expectedOutcome: 'A standardized benchmark exposing memory decay and hallucination in state space and transformer models.',
    limitations: 'High compute cost to generate full adversarial evaluation sweeps.',
    status: 'Published',
    reviewsCount: 15,
    createdAt: '2026-09-05',
    isVerified: true
  }
];

// MOCK CONTRIBUTORS (Organized by Academic Hierarchy)
export const MOCK_CONTRIBUTORS: Contributor[] = [
  // Tier 1: Research Scientists
  {
    id: 'user-101',
    name: 'Dr. Elena Rostova',
    hierarchyRole: 'Research Scientist',
    hierarchyRank: 1,
    title: 'Senior Research Scientist & Principal Investigator',
    institution: 'ETH Zürich / OpenResearch Fellow',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    bio: 'Leads the Sub-Quadratic Neural Architectures group at ETH Zürich, researching linear-time state space operators, triton kernels, and GPU memory scalability.',
    researchInterests: ['State Space Models', 'Linear Attention', 'Kernel Optimization', 'GPU Memory Architecture'],
    skills: ['PyTorch', 'Triton CUDA', 'Differential Geometry', 'Distributed Systems'],
    hIndex: 28,
    totalCitations: 4210,
    verifiedContributionsCount: 14,
    proposedContributionsCount: 19,
    publications: [
      { title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', year: 2022, journal: 'NeurIPS', doi: '10.48550/arXiv.2205.14135' },
      { title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces', year: 2023, journal: 'ACL / arXiv', doi: '10.48550/arXiv.2312.00752' }
    ],
    achievements: [
      'OpenResearch Grand Challenge Winner',
      'Lead Contributor on State Space Kernel Optimizations',
      'Reproducibility Lead for Long-Context Sequence Models'
    ],
    location: 'Zürich, Switzerland',
    email: 'elena.rostova@inf.ethz.ch',
    orcid: '0000-0002-1823-9201'
  },
  {
    id: 'user-104',
    name: 'Prof. David K. Miller',
    hierarchyRole: 'Research Scientist',
    hierarchyRank: 1,
    title: 'Principal Research Scientist & Professor of Physics',
    institution: 'MIT Center for Theoretical Physics',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    bio: 'Investigating topological phases of matter, Majorana zero modes, and fault-tolerant quantum error-correcting lattices in 2D van der Waals heterostructures.',
    researchInterests: ['Topological Quantum Computing', 'Twisted Bilayer Graphene', 'Majorana Anyons', 'Cryogenic Electronics'],
    skills: ['E-beam Lithography', 'Dilution Refrigeration', 'Quantum Field Theory', 'Microwave Engineering'],
    hIndex: 42,
    totalCitations: 9850,
    verifiedContributionsCount: 22,
    proposedContributionsCount: 25,
    publications: [
      { title: 'Quantum Computational Advantage Using Photons', year: 2020, journal: 'Science', doi: '10.1126/science.abe8770' }
    ],
    achievements: [
      'APS Fellow in Quantum Optics & Condensed Matter',
      'Precision Measurement Award in Quantum Electronics',
      'Quantum Advantage Experimental Verification Lead'
    ],
    location: 'Cambridge, MA, USA',
    email: 'dkmiller@mit.edu',
    orcid: '0000-0002-0192-8841'
  },

  // Tier 2: Researchers
  {
    id: 'user-102',
    name: 'Dr. Marcus Vance',
    hierarchyRole: 'Researcher',
    hierarchyRank: 2,
    title: 'Staff Research Fellow in Nanobiotechnology',
    institution: 'Harvard Wyss Institute',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    bio: 'Specializing in lipid nanoparticle delivery systems, mRNA therapeutics, and thermostable CRISPR endonuclease formulations for global distribution.',
    researchInterests: ['CRISPR-Cas Systems', 'Nanoparticle Delivery', 'Thermostability', 'Translational Medicine'],
    skills: ['Microfluidics', 'HPLC / Mass Spec', 'LNP Formulation', 'In Vivo Imaging'],
    hIndex: 19,
    totalCitations: 1840,
    verifiedContributionsCount: 9,
    proposedContributionsCount: 12,
    publications: [
      { title: 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity', year: 2012, journal: 'Science', doi: '10.1126/science.1225829' }
    ],
    achievements: [
      'Gates Foundation Global Health Innovator Grant',
      'Validated 3 Thermostable LNP Formulations for Cas Endonucleases'
    ],
    location: 'Boston, MA, USA',
    email: 'mvance@wyss.harvard.edu',
    orcid: '0000-0001-9041-3312'
  },
  {
    id: 'user-105',
    name: 'Dr. Claire Dupuis',
    hierarchyRole: 'Researcher',
    hierarchyRank: 2,
    title: 'Postdoctoral Research Fellow in Structural Biology',
    institution: 'Institut Pasteur / Sorbonne Université',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    bio: 'Conducting high-resolution cryo-electron microscopy and empirical evaluations of computational protein folding models on dynamic macromolecular assemblies.',
    researchInterests: ['Cryo-EM', 'Protein Dynamics', 'AlphaFold Evaluation', 'Viral Glycoproteins'],
    skills: ['Relion', 'CryoSPARC', 'Amber MD', 'Protein Expression'],
    hIndex: 15,
    totalCitations: 1220,
    verifiedContributionsCount: 7,
    proposedContributionsCount: 10,
    publications: [
      { title: 'Highly Accurate Protein Structure Prediction with AlphaFold', year: 2021, journal: 'Nature', doi: '10.1038/s41586-021-03819-2' }
    ],
    achievements: [
      'EMBO Postdoctoral Research Fellowship',
      'Resolved 2.1 Å High-Resolution Fusion Intermediate Structure'
    ],
    location: 'Paris, France',
    email: 'claire.dupuis@pasteur.fr',
    orcid: '0000-0002-7109-4413'
  },

  // Tier 3: PhD Scholars
  {
    id: 'user-103',
    name: 'Priya Sharma',
    hierarchyRole: 'PhD Scholar',
    hierarchyRank: 3,
    title: 'PhD Scholar in AI & Computational Biology',
    institution: 'Stanford University',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    bio: 'Doctoral scholar developing rigorous diagnostic benchmark datasets and multi-hop causal reasoning evaluations for long-context sequence models.',
    researchInterests: ['Benchmark Engineering', 'Chemical LLMs', 'Multi-Hop Reasoning', 'Evaluation Datasets'],
    skills: ['Python', 'HuggingFace Ecosystem', 'Synthetic Data Pipeline', 'Statistics'],
    hIndex: 12,
    totalCitations: 890,
    verifiedContributionsCount: 6,
    proposedContributionsCount: 8,
    publications: [
      { title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces', year: 2023, journal: 'ACL / arXiv', doi: '10.48550/arXiv.2312.00752' }
    ],
    achievements: [
      'Stanford Graduate Fellowship in Artificial Intelligence',
      'Author of MHC-256k Long-Context Benchmark Dataset'
    ],
    location: 'Palo Alto, CA, USA',
    email: 'psharma@cs.stanford.edu',
    orcid: '0000-0003-4412-8819'
  },
  {
    id: 'user-106',
    name: 'Lucas Lindqvist',
    hierarchyRole: 'PhD Scholar',
    hierarchyRank: 3,
    title: 'PhD Scholar in Quantum Hardware Engineering',
    institution: 'Delft University of Technology (TU Delft)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    bio: 'Doctoral candidate optimizing optical phase stability and photon transmission efficiency in integrated photonic and superconducting quantum systems.',
    researchInterests: ['Photonic Quantum Computing', 'Quantum Coherence', 'Cryogenic Control', 'Pulse Engineering'],
    skills: ['Qiskit Pulse', 'Interferometry Calibration', 'Cleanroom Lithography', 'Python'],
    hIndex: 9,
    totalCitations: 450,
    verifiedContributionsCount: 5,
    proposedContributionsCount: 6,
    publications: [
      { title: 'Quantum Computational Advantage Using Photons', year: 2020, journal: 'Science', doi: '10.1126/science.abe8770' }
    ],
    achievements: [
      'QuTech Excellence PhD Grant Awardee',
      'Demonstrated 99.8% Two-Qubit Gate Fidelity'
    ],
    location: 'Delft, Netherlands',
    email: 'l.lindqvist@tudelft.nl',
    orcid: '0000-0001-6623-9901'
  },

  // Tier 4: Students
  {
    id: 'user-107',
    name: 'Maya Chen',
    hierarchyRole: 'Student',
    hierarchyRank: 4,
    title: 'Graduate Research Student (M.S. EECS)',
    institution: 'UC Berkeley AI Research (BAIR)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    bio: 'Master’s student studying hardware profiling of linear attention kernels and empirical reproducibility of published foundation model benchmarks.',
    researchInterests: ['Kernel Profiling', 'Reproducibility Studies', 'Open Science Tools', 'Inference Optimization'],
    skills: ['C++', 'CUDA Basics', 'PyTorch Profiler', 'Linux Benchmarking'],
    hIndex: 3,
    totalCitations: 65,
    verifiedContributionsCount: 3,
    proposedContributionsCount: 4,
    publications: [
      { title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', year: 2022, journal: 'NeurIPS', doi: '10.48550/arXiv.2205.14135' }
    ],
    achievements: [
      'Berkeley Undergraduate Research Apprenticeship Honors',
      'Reproduced 3 NeurIPS Baselines in Open Science Challenge'
    ],
    location: 'Berkeley, CA, USA',
    email: 'mayachen@berkeley.edu',
    orcid: '0009-0004-1229-3011'
  },
  {
    id: 'user-108',
    name: 'Tariq Al-Mansoor',
    hierarchyRole: 'Student',
    hierarchyRank: 4,
    title: 'Undergraduate Research Honors Student',
    institution: 'University of Oxford (Materials Department)',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    bio: 'Final-year undergraduate researcher investigating sorbent contactor kinetics and thermodynamic efficiency in direct air capture processes.',
    researchInterests: ['Direct Air Capture', 'Sorption Kinetics', 'Carbon Mineralization', 'Materials Chemistry'],
    skills: ['Powder XRD', 'Gas Sorption Analysis', 'ChemDraw', 'Python'],
    hIndex: 2,
    totalCitations: 28,
    verifiedContributionsCount: 2,
    proposedContributionsCount: 3,
    publications: [
      { title: 'A Process for Capturing CO2 from the Atmosphere', year: 2018, journal: 'Joule', doi: '10.1016/j.joule.2018.05.006' }
    ],
    achievements: [
      'Oxford Departmental Materials Science Prize',
      'Co-author on Global Climate Innovation MOF Dataset'
    ],
    location: 'Oxford, United Kingdom',
    email: 'tariq.al-mansoor@materials.ox.ac.uk',
    orcid: '0009-0008-8812-4029'
  }
];

// MOCK ORGANIZATIONS
export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    name: 'AI Science Foundation',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    type: 'Non-Profit',
    location: 'San Francisco, CA',
    description: 'A global non-profit dedicated to funding open-source foundational research in artificial intelligence, mechanistic interpretability, and compute efficiency.',
    activeChallengesCount: 8,
    totalGrantsAwarded: '$4.2M',
    website: 'https://aisciencefoundation.org',
    focusAreas: ['Efficient LLMs', 'AI Safety', 'Mechanistic Interpretability', 'Open Compute']
  },
  {
    id: 'org-2',
    name: 'BioHealth Research Institute',
    logo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=120&q=80',
    type: 'Research Institute',
    location: 'Basel, Switzerland',
    description: 'International research alliance accelerating gene therapies, protein engineering, and open biomolecular datasets for global healthcare challenges.',
    activeChallengesCount: 5,
    totalGrantsAwarded: '$6.8M',
    website: 'https://biohealth-institute.org',
    focusAreas: ['CRISPR Engineering', 'RNA Therapeutics', 'Structural Biology', 'Target Discovery']
  },
  {
    id: 'org-3',
    name: 'Quantum Tech Labs',
    logo: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=120&q=80',
    type: 'Tech Enterprise',
    location: 'Munich, Germany',
    description: 'Pioneering solid-state quantum hardware architectures with a focus on topological fault-tolerance and cryogenic control systems.',
    activeChallengesCount: 3,
    totalGrantsAwarded: '$2.1M',
    website: 'https://quantumtechlabs.de',
    focusAreas: ['Topological Qubits', 'Cryogenic Control', 'Quantum Hardware', 'Nanofabrication']
  },
  {
    id: 'org-4',
    name: 'Stanford Center for Open AI Research',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=120&q=80',
    type: 'University',
    location: 'Palo Alto, CA',
    description: 'Academic institution advancing rigorous evaluation, reproducible benchmarks, and multidisciplinary scientific discovery through open collaboration.',
    activeChallengesCount: 6,
    totalGrantsAwarded: '$3.5M',
    website: 'https://stanford.edu/research/open-ai',
    focusAreas: ['Evaluation Harnesses', 'Scientific Reasoning', 'Multi-Modal Datasets', 'Ethical AI']
  },
  {
    id: 'org-5',
    name: 'Global Climate Innovation Initiative',
    logo: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=120&q=80',
    type: 'Non-Profit',
    location: 'Stockholm, Sweden',
    description: 'Catalyzing breakthrough engineering in direct air capture, battery electrochemistry, and clean energy storage through targeted grand challenges.',
    activeChallengesCount: 4,
    totalGrantsAwarded: '$5.0M',
    website: 'https://climateinnovation.org',
    focusAreas: ['Direct Air Capture', 'Battery Chemistry', 'Carbon Conversion', 'Green Hydrogen']
  }
];

// MOCK RESEARCH GRAPH NODES & EDGES (Coordinated Across 3 Distinct Scientific Lineages)
export const MOCK_GRAPH_NODES: GraphNode[] = [
  // --- Lineage 1: Artificial Intelligence (Albert Gu & Tri Dao / Mamba) ---
  {
    id: 'paper-1',
    label: 'Paper: Mamba (Selective SSMs)',
    type: 'paper',
    field: 'Artificial Intelligence',
    metadata: { title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces', subtext: 'Association for Computational Linguistics (ACL) / arXiv (2023)', authorOrOrg: 'Albert Gu & Tri Dao', status: 'Published' },
    x: 150,
    y: 70
  },
  {
    id: 'lim-1',
    label: 'Limitation: Backward Scan Memory',
    type: 'limitation',
    field: 'Artificial Intelligence',
    metadata: { title: 'High GPU Activation Scan Memory in Backward Pass', subtext: 'Identified in Mamba (ACL 2023)', status: 'Active Research Gap' },
    x: 150,
    y: 200
  },
  {
    id: 'chal-1',
    label: 'Challenge: O(1) Memory Kernel',
    type: 'challenge',
    field: 'Artificial Intelligence',
    metadata: { title: 'Reduce Gradient Memory Overhead to O(1)', subtext: 'AI Science Foundation ($50,000 Grant)', authorOrOrg: 'AI Science Foundation', status: 'Open Challenge' },
    x: 150,
    y: 340
  },
  {
    id: 'contrib-1',
    label: 'Proposal: Chunked Checkpoint Kernel',
    type: 'contribution',
    field: 'Artificial Intelligence',
    metadata: { title: 'Backward Recomputation Kernel via Chunked Checkpointing', subtext: 'Submitted by Dr. Elena Rostova', authorOrOrg: 'ETH Zürich', status: 'In Experimentation' },
    x: 150,
    y: 480
  },
  {
    id: 'exp-1',
    label: 'Experiment: 512k Token H100 GPU Run',
    type: 'experiment',
    field: 'Artificial Intelligence',
    metadata: { title: 'Benchmarking Memory Allocation on 80GB H100', subtext: 'Execution ID: EXP-8821', status: 'Completed' },
    x: 150,
    y: 620
  },
  {
    id: 'rev-1',
    label: 'Review: Peer Replication & Code Audit',
    type: 'review',
    field: 'Artificial Intelligence',
    metadata: { title: 'Independent Triton Kernel Memory Audit', subtext: 'Reviewed by Stanford AI Group', status: 'Verified' },
    x: 150,
    y: 750
  },
  {
    id: 'outcome-1',
    label: 'Outcome: Open-Source 1M Context Kernel',
    type: 'outcome',
    field: 'Artificial Intelligence',
    metadata: { title: 'S2-Chunked Recomputation Library v1.0 Released', subtext: 'Validated Research Artifact', status: 'Published Outcome' },
    x: 150,
    y: 880
  },

  // --- Lineage 2: Quantum Physics (Pan, Zhong et al. / Science 2020) ---
  {
    id: 'paper-3',
    label: 'Paper: Photonic Quantum Advantage',
    type: 'paper',
    field: 'Quantum Physics',
    metadata: { title: 'Quantum Computational Advantage Using Photons', subtext: 'Science (2020)', authorOrOrg: 'Zhong, Wang, Pan et al.', status: 'Published' },
    x: 440,
    y: 70
  },
  {
    id: 'lim-3',
    label: 'Limitation: Optical Transmission Loss',
    type: 'limitation',
    field: 'Quantum Physics',
    metadata: { title: 'Photon Loss in Multi-Mode Interferometer Arrays', subtext: 'Identified in Science (2020)', status: 'Active Research Gap' },
    x: 440,
    y: 200
  },
  {
    id: 'chal-3',
    label: 'Challenge: Transmission Loss Mitigation',
    type: 'challenge',
    field: 'Quantum Physics',
    metadata: { title: 'Mitigate Optical Transmission Loss in Large-Scale Gaussian Boson Sampling', subtext: 'Quantum Tech Labs ($100,000 Grant)', authorOrOrg: 'Quantum Tech Labs', status: 'Open Challenge' },
    x: 440,
    y: 340
  },
  {
    id: 'contrib-3',
    label: 'Proposal: Capacitive Couplers',
    type: 'contribution',
    field: 'Quantum Physics',
    metadata: { title: 'Fluxonium Capacitive Couplers for Crosstalk Suppression', subtext: 'Submitted by Lucas Lindqvist', authorOrOrg: 'TU Delft', status: 'Accepted' },
    x: 440,
    y: 480
  },
  {
    id: 'exp-3',
    label: 'Experiment: 20mK Dilution Pulse Sweep',
    type: 'experiment',
    field: 'Quantum Physics',
    metadata: { title: 'Cryogenic Readout & Coherence Lifetime Characterization', subtext: 'Execution ID: EXP-7740', status: 'Completed' },
    x: 440,
    y: 620
  },
  {
    id: 'rev-3',
    label: 'Review: Quantum Fidelity Audit',
    type: 'review',
    field: 'Quantum Physics',
    metadata: { title: 'Independent Randomized Benchmarking Gate Audit', subtext: 'Reviewed by MIT Center for Theoretical Physics', status: 'Verified' },
    x: 440,
    y: 750
  },
  {
    id: 'outcome-3',
    label: 'Outcome: 99.8% Two-Qubit Protocol',
    type: 'outcome',
    field: 'Quantum Physics',
    metadata: { title: 'Verified Fault-Tolerant Gate Synthesis Protocol', subtext: 'Validated Research Artifact', status: 'Published Outcome' },
    x: 440,
    y: 880
  },

  // --- Lineage 3: Genomics & Gene Editing (Jinek, Doudna, Charpentier / Science 2012) ---
  {
    id: 'paper-2',
    label: 'Paper: CRISPR-Cas9 Endonuclease',
    type: 'paper',
    field: 'Genomics & Gene Editing',
    metadata: { title: 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity', subtext: 'Science (2012)', authorOrOrg: 'Jinek, Doudna, Charpentier et al.', status: 'Published' },
    x: 730,
    y: 70
  },
  {
    id: 'lim-2',
    label: 'Limitation: Off-Target Cleavage',
    type: 'limitation',
    field: 'Genomics & Gene Editing',
    metadata: { title: 'Off-Target Cleavage & Ambient Nanoparticle Fragility', subtext: 'Identified in Science (2012)', status: 'Active Research Gap' },
    x: 730,
    y: 200
  },
  {
    id: 'chal-2',
    label: 'Challenge: High-Fidelity Cas9 Formulations',
    type: 'challenge',
    field: 'Genomics & Gene Editing',
    metadata: { title: 'Thermostable Formulation and High-Fidelity Cleavage for Cas9 Endonucleases', subtext: 'BioHealth Institute ($75,000 Grant)', authorOrOrg: 'BioHealth Institute', status: 'Open Challenge' },
    x: 730,
    y: 340
  },
  {
    id: 'contrib-2',
    label: 'Proposal: Trehalose Encapsulation',
    type: 'contribution',
    field: 'Genomics & Gene Editing',
    metadata: { title: 'Trehalose Matrix Encapsulation for Ambient Thermal Resilience', subtext: 'Submitted by Dr. Marcus Vance', authorOrOrg: 'Harvard Wyss', status: 'Accepted' },
    x: 730,
    y: 480
  },
  {
    id: 'exp-2',
    label: 'Experiment: 35-Day 40°C Storage Assay',
    type: 'experiment',
    field: 'Genomics & Gene Editing',
    metadata: { title: 'Cleavage Efficiency DLS & Gel Electrophoresis Assay', subtext: 'Execution ID: EXP-9014', status: 'Completed' },
    x: 730,
    y: 620
  },
  {
    id: 'outcome-2',
    label: 'Outcome: Field-Deployable CRISPR Vials',
    type: 'outcome',
    field: 'Genomics & Gene Editing',
    metadata: { title: 'Room-Temperature Stable Bridge-RNA LNP Protocol', subtext: 'Validated Research Artifact', status: 'Published Outcome' },
    x: 730,
    y: 750
  }
];

export const MOCK_GRAPH_EDGES: GraphEdge[] = [
  // AI Lineage
  { id: 'edge-1', source: 'paper-1', target: 'lim-1', relationship: 'identifies limitation' },
  { id: 'edge-2', source: 'lim-1', target: 'chal-1', relationship: 'addresses' },
  { id: 'edge-3', source: 'chal-1', target: 'contrib-1', relationship: 'addresses' },
  { id: 'edge-4', source: 'contrib-1', target: 'exp-1', relationship: 'tests' },
  { id: 'edge-5', source: 'exp-1', target: 'rev-1', relationship: 'replicates' },
  { id: 'edge-6', source: 'rev-1', target: 'outcome-1', relationship: 'extends' },

  // Quantum Lineage
  { id: 'edge-q1', source: 'paper-3', target: 'lim-3', relationship: 'identifies limitation' },
  { id: 'edge-q2', source: 'lim-3', target: 'chal-3', relationship: 'addresses' },
  { id: 'edge-q3', source: 'chal-3', target: 'contrib-3', relationship: 'addresses' },
  { id: 'edge-q4', source: 'contrib-3', target: 'exp-3', relationship: 'tests' },
  { id: 'edge-q5', source: 'exp-3', target: 'rev-3', relationship: 'replicates' },
  { id: 'edge-q6', source: 'rev-3', target: 'outcome-3', relationship: 'extends' },

  // Genomics Lineage
  { id: 'edge-7', source: 'paper-2', target: 'lim-2', relationship: 'identifies limitation' },
  { id: 'edge-8', source: 'lim-2', target: 'chal-2', relationship: 'addresses' },
  { id: 'edge-9', source: 'chal-2', target: 'contrib-2', relationship: 'addresses' },
  { id: 'edge-10', source: 'contrib-2', target: 'exp-2', relationship: 'tests' },
  { id: 'edge-11', source: 'exp-2', target: 'outcome-2', relationship: 'extends' }
];

// MOCK COMMUNITY ACTIVITY (Categorized: researchers, research-students, students, reviews)
export const MOCK_ACTIVITY: ActivityItem[] = [
  // Researchers Area
  {
    id: 'act-1',
    authorName: 'Dr. Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    authorRole: 'Principal Research Scientist · ETH Zürich',
    hierarchyRole: 'Research Scientist',
    category: 'researchers',
    action: 'published an open methodology proposal for',
    targetTitle: 'Reduce Gradient Memory Overhead in Linear Attention Models to O(1)',
    targetType: 'Challenge',
    timestamp: '2 hours ago',
    snippet: 'Published Triton CUDA kernel implementation reducing backward pass activation memory from O(N) to O(1) with custom chunked state checkpointing. Benchmark scripts available on GitHub.',
    likes: 38,
    comments: 9
  },
  {
    id: 'act-2',
    authorName: 'Prof. David K. Miller',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    authorRole: 'Senior Principal Scientist · MIT',
    hierarchyRole: 'Research Scientist',
    category: 'researchers',
    action: 'formulated a theoretical critique on',
    targetTitle: 'Topological Quantum Computing in Bilayer Graphene Nanoribbons',
    targetType: 'Paper',
    timestamp: '1 day ago',
    snippet: 'Outlined the physical limitations of charge fluctuation noise in electrostatic gate geometries, proposing superconductor-semiconductor proximity hybridizations.',
    likes: 45,
    comments: 14
  },

  // Research Student Area
  {
    id: 'act-3',
    authorName: 'Priya Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    authorRole: 'PhD Scholar · Stanford University',
    hierarchyRole: 'PhD Scholar',
    category: 'research-students',
    action: 'released public evaluation dataset for',
    targetTitle: 'Associative Memory Benchmarking Suite for Long-Context LLMs',
    targetType: 'Challenge',
    timestamp: '4 hours ago',
    snippet: 'Constructed an automated synthetic test set of 1,200 multi-hop reasoning chains spanning 256k tokens. Evaluated 8 open-weights models and observed 34% accuracy drop after 64k tokens.',
    likes: 52,
    comments: 16
  },
  {
    id: 'act-4',
    authorName: 'Lucas Lindqvist',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    authorRole: 'PhD Scholar · TU Delft',
    hierarchyRole: 'PhD Scholar',
    category: 'research-students',
    action: 'shared cryogenic dilution experimental calibration logs on',
    targetTitle: 'Fluxonium Qubit Coherence Optimization',
    targetType: 'Experiment',
    timestamp: '8 hours ago',
    snippet: 'Demonstrated that residual infrared radiation inside the dilution shield limits T1 relaxation to 420 microseconds. Added Eccosorb filtering to mitigate photon leakage.',
    likes: 29,
    comments: 7
  },

  // Students Area
  {
    id: 'act-5',
    authorName: 'Maya Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    authorRole: 'Graduate Research Student · UC Berkeley',
    hierarchyRole: 'Student',
    category: 'students',
    action: 'started an open reading and replication group for',
    targetTitle: 'Linear-Time Attention Mechanisms via Sub-Quadratic State Space Kernels',
    targetType: 'Paper',
    timestamp: '6 hours ago',
    snippet: 'Organizing a student study group to profile the Triton CUDA kernels on consumer RTX 4090 GPUs. All students and beginners welcome to contribute replication PRs!',
    likes: 64,
    comments: 23
  },
  {
    id: 'act-6',
    authorName: 'Tariq Al-Mansoor',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    authorRole: 'Undergraduate Research Student · Oxford',
    hierarchyRole: 'Student',
    category: 'students',
    action: 'documented student lab notebook findings on',
    targetTitle: 'Humidity-Resistant Amine Functionalization for MOF Direct Air Capture',
    targetType: 'Challenge',
    timestamp: '1 day ago',
    snippet: 'Tested water contact angles on fluorinated MOF-89 pellets. Found that hydrophobicity improved from 42° to 118° without sacrificing more than 6% nitrogen BET surface area.',
    likes: 31,
    comments: 8
  },

  // Reviews Block
  {
    id: 'act-7',
    authorName: 'Dr. Marcus Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    authorRole: 'Staff Research Fellow · Harvard Wyss',
    hierarchyRole: 'Researcher',
    category: 'reviews',
    action: 'conducted independent peer replication audit on',
    targetTitle: 'Trehalose Matrix Encapsulation of bRNA-v4',
    targetType: 'Experiment',
    timestamp: '3 hours ago',
    snippet: 'Audit Verdict: [VERIFIED & INDEPENDENTLY REPLICATED]. Confirmed 94.2% cleavage efficiency remaining after 35 days storage at 40°C in primary human hepatocyte assays.',
    likes: 78,
    comments: 19
  },
  {
    id: 'act-8',
    authorName: 'Dr. Claire Dupuis',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    authorRole: 'Postdoctoral Fellow · Institut Pasteur',
    hierarchyRole: 'Researcher',
    category: 'reviews',
    action: 'submitted blind peer review decision for',
    targetTitle: 'Cryo-EM Reconstruction of Bacterial Immune Complex',
    targetType: 'Contribution',
    timestamp: '12 hours ago',
    snippet: 'Review Status: [ACCEPTED WITH MINOR REVISIONS]. The FSC gold-standard resolution claim of 2.1 Å is well-supported by local resolution heatmaps and independent half-map correlations.',
    likes: 41,
    comments: 5
  }
];
