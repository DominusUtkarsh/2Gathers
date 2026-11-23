export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tokens: number;
  headline: string;
  skills: string[];
  bio: string;
};

export type MockJob = {
  id: string;
  title: string;
  client: string;
  description: string;
  budget: string;
  budgetNumber?: number;
  tokenCost: number;
  matchScore: number;
  tags: string[];
  status: "Open" | "Featured" | "Matched" | "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
  category?: string;
  experienceLevel?: "Entry" | "Intermediate" | "Expert";
  clientId?: number;
  location?: string;
  createdAt?: string;
};

export type MockTokenTransaction = {
  id: string;
  type: "earn" | "buy" | "spend" | "transfer";
  label: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
};

export type MockFaq = {
  question: string;
  answer: string;
};

export type MockTeamMember = {
  name: string;
  role: string;
  bio: string;
};

export const mockUsers: MockUser[] = [
  {
    id: "u1",
    name: "Kunal Saini",
    email: "kunal112@gmail.com",
    role: "FREELANCER",
    tokens: 480,
    headline: "Product Designer & Full-Stack Next.js Specialist",
    skills: ["Next.js", "TypeScript", "Tailwind CSS", "React", "Node.js"],
    bio: "Builds polished marketplace and SaaS experiences with clean code, responsive design, and robust API integrations.",
  },
  {
    id: "u2",
    name: "Aarav Mehta",
    email: "aarav@2gathers.dev",
    role: "CLIENT",
    tokens: 800,
    headline: "VP of Product at Studio North",
    skills: ["Hiring", "Product Strategy", "Technical Leadership"],
    bio: "Uses 2Gathers to post high-impact engineering projects and scout verified technical talent.",
  },
  {
    id: "u3",
    name: "Script Four",
    email: "script4@2gathers.dev",
    role: "ADMIN",
    tokens: 1200,
    headline: "Platform Operations & Proctoring Security",
    skills: ["Platform Security", "Proctoring Integrity", "Policy Controls"],
    bio: "Oversees assessment verification, AI anti-cheating audit models, and escrow milestone release.",
  },
  {
    id: "u4",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    role: "FREELANCER",
    tokens: 920,
    headline: "AI/ML Systems Engineer & Python Architect",
    skills: ["Python", "PyTorch", "FastAPI", "Docker", "LangChain"],
    bio: "Specializes in production LLM pipelines, computer vision models, and high-throughput real-time APIs.",
  },
  {
    id: "u5",
    name: "Rohan Varma",
    email: "rohan.v@example.com",
    role: "FREELANCER",
    tokens: 760,
    headline: "Distributed Systems & Cloud DevOps Lead",
    skills: ["Go", "Kubernetes", "AWS", "Terraform", "PostgreSQL"],
    bio: "7+ years scaling cloud infrastructure and building zero-downtime microservices with automated CI/CD.",
  },
  {
    id: "u6",
    name: "Sana Parveen",
    email: "sana.p@example.com",
    role: "FREELANCER",
    tokens: 610,
    headline: "Computer Science Undergrad & Open-Source Fellow",
    skills: ["JavaScript", "React", "Python", "Algorithms", "DSA"],
    bio: "3rd-year CS student with 500+ LeetCode problems solved and contributions to popular open-source tooling.",
  },
  {
    id: "u7",
    name: "Vikramaditya Iyer",
    email: "vikram.iyer@example.com",
    role: "FREELANCER",
    tokens: 1150,
    headline: "Smart Contract Security & Solidity Auditor",
    skills: ["Solidity", "Hardhat", "Ethers.js", "Web3", "Foundry"],
    bio: "Audits EVM protocols and architects decentralized escrow tokenomics with mathematical rigor.",
  },
  {
    id: "u8",
    name: "Ananya Deshmukh",
    email: "ananya.d@example.com",
    role: "FREELANCER",
    tokens: 830,
    headline: "Senior UI/UX Designer & Design Systems Lead",
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Tailwind"],
    bio: "Crafts accessible, high-conversion enterprise interfaces from zero to production design token libraries.",
  },
  {
    id: "u9",
    name: "Aditya Nair",
    email: "aditya.n@example.com",
    role: "FREELANCER",
    tokens: 520,
    headline: "Software Engineering Student & Hackathon Winner",
    skills: ["TypeScript", "Next.js", "Node.js", "SQL", "Git"],
    bio: "Passionate student developer who won 3 national hackathons building full-stack web and mobile apps.",
  },
  {
    id: "u10",
    name: "Elena Rostova",
    email: "elena.r@example.com",
    role: "FREELANCER",
    tokens: 990,
    headline: "Lead Mobile Developer (React Native & Flutter)",
    skills: ["React Native", "Flutter", "iOS", "Android", "GraphQL"],
    bio: "Has launched 12+ apps to Google Play and App Store with 4.8+ average ratings and seamless offline sync.",
  },
];

export interface MockFreelancerProfile {
  id: number;
  userId?: number;
  username: string;
  name: string;
  role: string;
  tokens: number;
  freelancerProfile: {
    professionalTitle: string;
    bio: string;
    skills: string;
    experienceLevel: string;
    hourlyRateUsd: number;
    country: string;
    city: string;
    languages: string;
    portfolioUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    education?: string | null;
    certifications?: string | null;
    availability: string;
    responseTime: string;
  };
  _count: {
    proposals: number;
    receivedReviews: number;
  };
  stats: {
    acceptedProposals: number;
    completedProjects: number;
    averageRating: number;
  };
  category: "Student" | "Working Professional";
  avatarInitials: string;
}

export const mockFreelancersList: MockFreelancerProfile[] = [
  {
    id: 1,
    username: "kunal_saini",
    name: "Kunal Saini",
    role: "FREELANCER",
    tokens: 480,
    category: "Working Professional",
    avatarInitials: "KS",
    freelancerProfile: {
      professionalTitle: "Senior Full-Stack & Next.js Architect",
      bio: "6+ years shipping high-performance web applications, SaaS dashboards, and automated proctoring platforms with Next.js, React, and TypeScript.",
      skills: "Next.js, React, TypeScript, Tailwind CSS, Node.js, PostgreSQL, REST APIs",
      experienceLevel: "EXPERT",
      hourlyRateUsd: 75,
      country: "India",
      city: "Bengaluru",
      languages: "English (Fluent), Hindi (Native)",
      portfolioUrl: "https://kunalsaini.dev",
      githubUrl: "https://github.com/kunalsaini",
      linkedinUrl: "https://linkedin.com/in/kunalsaini",
      education: "B.Tech in Computer Science, NIT Jalandhar",
      certifications: "Meta Certified Senior Front-End Developer, AWS Certified Developer",
      availability: "FULL_TIME",
      responseTime: "Within 1 hour",
    },
    _count: {
      proposals: 42,
      receivedReviews: 28,
    },
    stats: {
      acceptedProposals: 36,
      completedProjects: 34,
      averageRating: 4.96,
    },
  },
  {
    id: 4,
    username: "priya_ai",
    name: "Priya Sharma",
    role: "FREELANCER",
    tokens: 920,
    category: "Working Professional",
    avatarInitials: "PS",
    freelancerProfile: {
      professionalTitle: "Staff AI/ML Engineer & LLM Specialist",
      bio: "Ex-Google research fellow specializing in fine-tuning open weights, RAG architectures, PyTorch pipelines, and scalable vector search implementations.",
      skills: "Python, PyTorch, LangChain, FastAPI, Vector DBs, HuggingFace, Docker",
      experienceLevel: "EXPERT",
      hourlyRateUsd: 110,
      country: "India",
      city: "Pune",
      languages: "English (Bilingual), Hindi (Native)",
      portfolioUrl: "https://priyasharma.ai",
      githubUrl: "https://github.com/priyasharma",
      linkedinUrl: "https://linkedin.com/in/priyasharma-ai",
      education: "M.S. in Machine Learning, IIT Bombay",
      certifications: "Google Cloud Professional Machine Learning Engineer",
      availability: "PART_TIME",
      responseTime: "Under 2 hours",
    },
    _count: {
      proposals: 38,
      receivedReviews: 31,
    },
    stats: {
      acceptedProposals: 35,
      completedProjects: 31,
      averageRating: 4.98,
    },
  },
  {
    id: 5,
    username: "rohan_cloud",
    name: "Rohan Varma",
    role: "FREELANCER",
    tokens: 760,
    category: "Working Professional",
    avatarInitials: "RV",
    freelancerProfile: {
      professionalTitle: "Lead Cloud DevOps & Kubernetes Engineer",
      bio: "Infrastructure architect focused on automated CI/CD, Kubernetes cluster orchestration, Terraform IaC, and 99.99% uptime reliability engineering.",
      skills: "Kubernetes, Go, AWS, Docker, Terraform, Prometheus, CI/CD, Linux",
      experienceLevel: "EXPERT",
      hourlyRateUsd: 90,
      country: "India",
      city: "Hyderabad",
      languages: "English (Fluent), Telugu (Native)",
      portfolioUrl: "https://rohanvarma.cloud",
      githubUrl: "https://github.com/rohanvarma",
      linkedinUrl: "https://linkedin.com/in/rohanvarma-devops",
      education: "B.Tech in Information Technology, BITS Pilani",
      certifications: "Certified Kubernetes Administrator (CKA), AWS Solutions Architect Pro",
      availability: "FULL_TIME",
      responseTime: "Within 1 hour",
    },
    _count: {
      proposals: 45,
      receivedReviews: 37,
    },
    stats: {
      acceptedProposals: 40,
      completedProjects: 38,
      averageRating: 4.92,
    },
  },
  {
    id: 6,
    username: "sana_code",
    name: "Sana Parveen",
    role: "FREELANCER",
    tokens: 610,
    category: "Student",
    avatarInitials: "SP",
    freelancerProfile: {
      professionalTitle: "CS Undergraduate & High-Precision Problem Solver",
      bio: "Pre-final year Computer Science student with exceptional Data Structures & Algorithms acumen (LeetCode Knight, 2000+ rating). Quick learner with sharp analytical instincts.",
      skills: "JavaScript, TypeScript, Python, C++, Data Structures, React, Node.js",
      experienceLevel: "ENTRY_LEVEL",
      hourlyRateUsd: 35,
      country: "India",
      city: "Delhi",
      languages: "English (Fluent), Urdu (Native)",
      portfolioUrl: "https://sanaparveen.tech",
      githubUrl: "https://github.com/sanaparveen",
      linkedinUrl: "https://linkedin.com/in/sanaparveen-cs",
      education: "B.Tech in Computer Science & Engineering (Class of 2026), DTU",
      certifications: "freeCodeCamp Full-Stack Certification, HackerRank Problem Solving (Gold)",
      availability: "PART_TIME",
      responseTime: "Under 30 minutes",
    },
    _count: {
      proposals: 29,
      receivedReviews: 19,
    },
    stats: {
      acceptedProposals: 24,
      completedProjects: 22,
      averageRating: 4.94,
    },
  },
  {
    id: 7,
    username: "vikram_web3",
    name: "Vikramaditya Iyer",
    role: "FREELANCER",
    tokens: 1150,
    category: "Working Professional",
    avatarInitials: "VI",
    freelancerProfile: {
      professionalTitle: "Smart Contract Security Auditor & Web3 Engineer",
      bio: "Securing decentralized finance and escrow tokenomics. Audited 20+ protocols with zero critical vulnerabilities missed. Deep expertise in EVM bytecode and gas optimization.",
      skills: "Solidity, Hardhat, Ethers.js, Web3.js, Foundry, EVM, Smart Contracts",
      experienceLevel: "EXPERT",
      hourlyRateUsd: 125,
      country: "India",
      city: "Mumbai",
      languages: "English (Fluent), Tamil (Native)",
      portfolioUrl: "https://vikramiyer.eth",
      githubUrl: "https://github.com/vikramiyer",
      linkedinUrl: "https://linkedin.com/in/vikramaditya-iyer",
      education: "B.E. in Computer Engineering, VJTI Mumbai",
      certifications: "ConsenSys Certified Blockchain Developer",
      availability: "HOURLY",
      responseTime: "Under 2 hours",
    },
    _count: {
      proposals: 52,
      receivedReviews: 44,
    },
    stats: {
      acceptedProposals: 46,
      completedProjects: 44,
      averageRating: 4.99,
    },
  },
  {
    id: 8,
    username: "ananya_design",
    name: "Ananya Deshmukh",
    role: "FREELANCER",
    tokens: 830,
    category: "Working Professional",
    avatarInitials: "AD",
    freelancerProfile: {
      professionalTitle: "Principal Product Designer & Design Systems Lead",
      bio: "Designing cohesive digital products that solve complex user journeys. Expert in Figma component architectures, micro-interactions, responsive design, and developer handoffs.",
      skills: "Figma, Design Systems, UI/UX, Wireframing, User Research, Tailwind CSS",
      experienceLevel: "EXPERT",
      hourlyRateUsd: 85,
      country: "India",
      city: "Bengaluru",
      languages: "English (Fluent), Marathi (Native)",
      portfolioUrl: "https://ananyadesign.studio",
      githubUrl: "https://github.com/ananyadeshmukh",
      linkedinUrl: "https://linkedin.com/in/ananyadeshmukh-ux",
      education: "B.Des in Interaction Design, NID Ahmedabad",
      certifications: "Nielsen Norman Group UX Master Certified",
      availability: "FULL_TIME",
      responseTime: "Within 1 hour",
    },
    _count: {
      proposals: 36,
      receivedReviews: 30,
    },
    stats: {
      acceptedProposals: 32,
      completedProjects: 30,
      averageRating: 4.95,
    },
  },
  {
    id: 9,
    username: "aditya_swe",
    name: "Aditya Nair",
    role: "FREELANCER",
    tokens: 520,
    category: "Student",
    avatarInitials: "AN",
    freelancerProfile: {
      professionalTitle: "Computer Science Scholar & Full-Stack Builder",
      bio: "Final-year software engineering undergraduate. Won Smart India Hackathon 2024. Experienced with building fast, accessible web applications and RESTful backend architectures.",
      skills: "TypeScript, Next.js, Express, PostgreSQL, Prisma, Git, Tailwind CSS",
      experienceLevel: "ENTRY_LEVEL",
      hourlyRateUsd: 30,
      country: "India",
      city: "Kochi",
      languages: "English (Fluent), Malayalam (Native)",
      portfolioUrl: "https://adityanair.dev",
      githubUrl: "https://github.com/adityanair",
      linkedinUrl: "https://linkedin.com/in/adityanair-swe",
      education: "B.Tech in Computer Science, NIT Calicut",
      certifications: "AWS Certified Cloud Practitioner",
      availability: "PART_TIME",
      responseTime: "Within 1 hour",
    },
    _count: {
      proposals: 22,
      receivedReviews: 16,
    },
    stats: {
      acceptedProposals: 19,
      completedProjects: 18,
      averageRating: 4.91,
    },
  },
  {
    id: 10,
    username: "elena_mobile",
    name: "Elena Rostova",
    role: "FREELANCER",
    tokens: 990,
    category: "Working Professional",
    avatarInitials: "ER",
    freelancerProfile: {
      professionalTitle: "Senior Cross-Platform Mobile Engineer",
      bio: "8 years developing smooth native and hybrid mobile experiences. Deep background in state management, smooth 60fps animations, background geolocation, and offline-first architectures.",
      skills: "React Native, Flutter, Swift, Kotlin, GraphQL, Redux, Mobile Security",
      experienceLevel: "EXPERT",
      hourlyRateUsd: 95,
      country: "United Kingdom",
      city: "London",
      languages: "English (Fluent), Russian (Native)",
      portfolioUrl: "https://elenarostova.dev",
      githubUrl: "https://github.com/elenarostova",
      linkedinUrl: "https://linkedin.com/in/elena-rostova",
      education: "B.Sc. in Computer Systems, King's College London",
      certifications: "Google Associate Android Developer",
      availability: "FULL_TIME",
      responseTime: "Under 2 hours",
    },
    _count: {
      proposals: 48,
      receivedReviews: 41,
    },
    stats: {
      acceptedProposals: 42,
      completedProjects: 40,
      averageRating: 4.97,
    },
  },
  {
    id: 11,
    username: "neha_datascience",
    name: "Neha Sengupta",
    role: "FREELANCER",
    tokens: 880,
    category: "Working Professional",
    avatarInitials: "NS",
    freelancerProfile: {
      professionalTitle: "Senior Data Scientist & Analytics Engineer",
      bio: "Specializing in statistical inference, machine learning models for user retention, recommendation engines, and clean automated dbt/Snowflake pipelines.",
      skills: "Python, SQL, Pandas, Scikit-Learn, Snowflake, dbt, Tableau, Data Modeling",
      experienceLevel: "INTERMEDIATE",
      hourlyRateUsd: 80,
      country: "India",
      city: "Kolkata",
      languages: "English (Fluent), Bengali (Native)",
      portfolioUrl: "https://nehasengupta.data",
      githubUrl: "https://github.com/nehasengupta",
      linkedinUrl: "https://linkedin.com/in/nehasengupta",
      education: "M.Stat, Indian Statistical Institute (ISI)",
      certifications: "Snowflake SnowPro Core Certified",
      availability: "FULL_TIME",
      responseTime: "Within 2 hours",
    },
    _count: {
      proposals: 34,
      receivedReviews: 26,
    },
    stats: {
      acceptedProposals: 30,
      completedProjects: 29,
      averageRating: 4.93,
    },
  },
  {
    id: 12,
    username: "rahul_student",
    name: "Rahul Joshi",
    role: "FREELANCER",
    tokens: 440,
    category: "Student",
    avatarInitials: "RJ",
    freelancerProfile: {
      professionalTitle: "Junior Frontend Engineer & CS Student",
      bio: "Undergraduate computer science student passionate about modern web technologies. Specializes in transforming complex Figma mocks into semantic, responsive React components.",
      skills: "React, JavaScript, HTML5, CSS3, Tailwind CSS, Responsive Web Design",
      experienceLevel: "ENTRY_LEVEL",
      hourlyRateUsd: 25,
      country: "India",
      city: "Pune",
      languages: "English (Fluent), Hindi (Native)",
      portfolioUrl: "https://rahuljoshi.me",
      githubUrl: "https://github.com/rahuljoshi",
      linkedinUrl: "https://linkedin.com/in/rahuljoshi-dev",
      education: "B.E. in Information Technology (Class of 2026), COEP Pune",
      certifications: "Meta Certified Front-End Developer Specialization",
      availability: "PART_TIME",
      responseTime: "Under 1 hour",
    },
    _count: {
      proposals: 18,
      receivedReviews: 12,
    },
    stats: {
      acceptedProposals: 14,
      completedProjects: 14,
      averageRating: 4.88,
    },
  },
];

export const mockJobs: MockJob[] = [
  {
    id: "j1",
    title: "Build a clean AI matching dashboard",
    client: "Studio North",
    description: "Design and implement a highly polished freelancer dashboard with recommendation cards, token metrics, and real-time activity charts.",
    budget: "$2,400",
    budgetNumber: 2400,
    tokenCost: 45,
    matchScore: 97,
    tags: ["Next.js", "Dashboard", "AI", "Tailwind CSS"],
    status: "Featured",
    category: "Full Stack",
    experienceLevel: "Expert",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-18T10:00:00Z",
  },
  {
    id: "j2",
    title: "Token wallet prototype for a marketplace",
    client: "Inkwell Labs",
    description: "Prototype a token economy with earn, spend, and transfer flows while keeping the UI clean, minimalist, and cryptographically sound.",
    budget: "$1,850",
    budgetNumber: 1850,
    tokenCost: 35,
    matchScore: 93,
    tags: ["Fintech", "Wallet", "Blockchain", "TypeScript"],
    status: "Open",
    category: "Blockchain",
    experienceLevel: "Intermediate",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-19T14:30:00Z",
  },
  {
    id: "j3",
    title: "Chatbot assistant for candidate support",
    client: "Northstar HR",
    description: "Create an intelligent conversational interface that helps freelancers find relevant jobs, clarify assessment guidelines, and track tokens.",
    budget: "$1,200",
    budgetNumber: 1200,
    tokenCost: 25,
    matchScore: 88,
    tags: ["Chatbot", "AI UX", "Support", "FastAPI"],
    status: "Matched",
    category: "AI & ML",
    experienceLevel: "Intermediate",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-17T09:15:00Z",
  },
  {
    id: "j4",
    title: "Responsive landing page for a hiring platform",
    client: "Orbit Works",
    description: "Build a modern, serious landing page with subtle gradients, responsive navigation, and accessible dark/light contrast rules.",
    budget: "$950",
    budgetNumber: 950,
    tokenCost: 15,
    matchScore: 84,
    tags: ["UI", "Brand", "Responsive", "Figma to Code"],
    status: "Open",
    category: "Frontend",
    experienceLevel: "Entry",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-20T11:00:00Z",
  },
  {
    id: "j5",
    title: "LLM Fine-Tuning & Multi-Document RAG Pipeline",
    client: "Apex Health AI",
    description: "Architect and deploy an enterprise retrieval-augmented generation pipeline on HIPAA-compliant documents using Python, Qdrant, and LangChain.",
    budget: "$4,500",
    budgetNumber: 4500,
    tokenCost: 50,
    matchScore: 96,
    tags: ["Python", "RAG", "LLMs", "Vector DB", "Docker"],
    status: "Featured",
    category: "AI & ML",
    experienceLevel: "Expert",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-21T08:00:00Z",
  },
  {
    id: "j6",
    title: "Zero-Downtime PostgreSQL Sharding & Redis Caching",
    client: "CloudScale Systems",
    description: "Optimize high-frequency database operations for 50k concurrent users. Implement connection pooling, horizontal read replicas, and Redis cache invalidation.",
    budget: "$3,200",
    budgetNumber: 3200,
    tokenCost: 40,
    matchScore: 92,
    tags: ["PostgreSQL", "Redis", "Database Optimization", "Go"],
    status: "Open",
    category: "Backend",
    experienceLevel: "Expert",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-21T13:45:00Z",
  },
  {
    id: "j7",
    title: "Student-Friendly: Automated Web Scraper & Price Tracker",
    client: "MarketPulse Retail",
    description: "Build a lightweight Python script that monitors price changes across 20 e-commerce sites and logs changes to an SQLite database with email alerts.",
    budget: "$600",
    budgetNumber: 600,
    tokenCost: 10,
    matchScore: 89,
    tags: ["Python", "BeautifulSoup", "Automation", "SQLite"],
    status: "Open",
    category: "Python & Scripting",
    experienceLevel: "Entry",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-22T09:20:00Z",
  },
  {
    id: "j8",
    title: "Smart Contract Escrow with Multi-Sig Arbitration",
    client: "QuantumFi Protocols",
    description: "Develop, test, and formally verify an ERC-20 compliant milestone escrow contract with role-based arbitrator release and gas-optimized withdrawal mechanisms.",
    budget: "$3,800",
    budgetNumber: 3800,
    tokenCost: 45,
    matchScore: 94,
    tags: ["Solidity", "Hardhat", "Foundry", "Security Audit"],
    status: "Featured",
    category: "Blockchain",
    experienceLevel: "Expert",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-22T15:10:00Z",
  },
  {
    id: "j9",
    title: "Cross-Platform React Native Fitness Mobile App",
    client: "PulseFit Tech",
    description: "Develop a native mobile app for iOS and Android featuring workout logs, real-time Bluetooth heart rate monitor connectivity, and offline caching.",
    budget: "$2,900",
    budgetNumber: 2900,
    tokenCost: 35,
    matchScore: 91,
    tags: ["React Native", "TypeScript", "Mobile", "Bluetooth"],
    status: "Open",
    category: "Mobile",
    experienceLevel: "Intermediate",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-22T17:00:00Z",
  },
  {
    id: "j10",
    title: "Interactive Documentation Portal & API Playground",
    client: "DevCore Tools",
    description: "Implement a clean documentation site with MDX, interactive Swagger/OpenAPI execution blocks, code snippet copying, and search indexing.",
    budget: "$1,400",
    budgetNumber: 1400,
    tokenCost: 20,
    matchScore: 86,
    tags: ["Next.js", "MDX", "Documentation", "Tailwind CSS"],
    status: "Open",
    category: "Frontend",
    experienceLevel: "Entry",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-23T07:45:00Z",
  },
  {
    id: "j11",
    title: "Enterprise B2B Design System in Figma (80+ Components)",
    client: "Stratum Enterprise",
    description: "Design an exhaustive enterprise Figma design system with auto-layout v5, comprehensive design tokens, WCAG AA compliance, and dark mode variants.",
    budget: "$2,100",
    budgetNumber: 2100,
    tokenCost: 30,
    matchScore: 90,
    tags: ["Figma", "UI/UX", "Design System", "WCAG"],
    status: "Open",
    category: "Design",
    experienceLevel: "Intermediate",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-23T11:30:00Z",
  },
  {
    id: "j12",
    title: "Kubernetes (EKS) Multi-Region Deployment with ArgoCD",
    client: "Nexus Infrastructure",
    description: "Configure declarative GitOps deployments using ArgoCD, HashiCorp Vault for secrets management, and automated cluster autoscaling on AWS EKS.",
    budget: "$3,600",
    budgetNumber: 3600,
    tokenCost: 40,
    matchScore: 95,
    tags: ["Kubernetes", "AWS EKS", "ArgoCD", "Terraform"],
    status: "Featured",
    category: "DevOps",
    experienceLevel: "Expert",
    clientId: 2,
    location: "Remote",
    createdAt: "2026-04-23T14:00:00Z",
  },
];

export const mockTokenTransactions: MockTokenTransaction[] = [
  {
    id: "t1",
    type: "earn",
    label: "Completed learning module",
    amount: 30,
    balanceAfter: 240,
    createdAt: "2026-04-10T09:30:00Z",
  },
  {
    id: "t2",
    type: "spend",
    label: "Applied to premium job",
    amount: -45,
    balanceAfter: 210,
    createdAt: "2026-04-10T10:15:00Z",
  },
  {
    id: "t3",
    type: "buy",
    label: "Bought tokens via wallet",
    amount: 120,
    balanceAfter: 330,
    createdAt: "2026-04-10T11:05:00Z",
  },
  {
    id: "t4",
    type: "transfer",
    label: "Transferred to freelancer",
    amount: -40,
    balanceAfter: 290,
    createdAt: "2026-04-10T11:48:00Z",
  },
];

export const mockTeam: MockTeamMember[] = [
  {
    name: "Product Team",
    role: "Vision",
    bio: "Shipping a focused freelancing platform with quality tooling and simple workflows.",
  },
  {
    name: "Engineering Team",
    role: "Platform",
    bio: "Maintaining the AI matching engine, token ledger, and future blockchain integration path.",
  },
  {
    name: "Support Team",
    role: "Success",
    bio: "Helping clients and freelancers get value from the platform quickly and safely.",
  },
];

export const mockFaqs: MockFaq[] = [
  {
    question: "How do tokens work?",
    answer: "Tokens are the platform currency used for premium applications, boosts, and wallet rewards. Freelancers earn tokens by completing jobs and clients buy tokens to post premium jobs.",
  },
  {
    question: "Can I use this without crypto?",
    answer: "Yes. The prototype simulates blockchain behavior now and can evolve into real web3 later. You can link a wallet address on the Wallet page to practice transfers.",
  },
  {
    question: "How does AI job matching work?",
    answer: "Job recommendations are scored from your skills, role fit, availability, and token activity. The AI Search Assistant helps you find jobs relevant to your profile.",
  },
  {
    question: "Is the database real?",
    answer: "Yes. Prisma persists your account data, job history, and wallet activity in the configured PostgreSQL database.",
  },
];

export function getMockUser(id: string) {
  return mockUsers.find((user) => user.id === id) ?? mockUsers[0];
}

export function getMockWallet(userId: string) {
  const user = getMockUser(userId);
  return {
    userId: user.id,
    address: `twogathers:${user.id}:wallet`,
    balance: user.tokens,
    tokenName: "2GTH",
    network: "Simulated Ledger",
  };
}

// ==========================================
// ASSESSMENT & CODING TASKS SYSTEM
// Best for Students & Working Professionals
// ==========================================
export type SupportedLanguage = "javascript" | "typescript" | "python" | "java";

export type MockTask = {
  id: string;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
  rewardTokens: number;
  timeLimit?: number;
  functionName: string;
  language: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  starterCodeByLanguage: Record<SupportedLanguage, string>;
  targetAudience: "STUDENT" | "PROFESSIONAL" | "ALL";
  badge?: string;
};

export type MockTestCase = {
  args: unknown[];
  expected: unknown;
  description: string;
  hidden?: boolean;
};

export const mockTasks: MockTask[] = [
  // --- FOUNDATIONAL & STUDENT-FOCUSED ASSESSMENTS ---
  {
    id: "t1",
    title: "Sum of Two Numbers",
    description: "Write a function that takes two numbers and returns their sum. Essential logic test.",
    difficulty: "BEGINNER",
    category: "Basic Math",
    rewardTokens: 10,
    timeLimit: 15,
    functionName: "sum",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "Student Essential",
    starterCodeByLanguage: {
      javascript: `function sum(a, b) {
  // Write your code here
  return a + b;
}`,
      typescript: `function sum(a: number, b: number): number {
  // Write your code here
  return a + b;
}`,
      python: `def sum(a, b):
    # Write your code here
    return a + b`,
      java: `class Solution {
    public int sum(int a, int b) {
        // Write your code here
        return a + b;
    }
}`,
    },
  },
  {
    id: "t2",
    title: "Even or Odd Parity Check",
    description: "Write a function that checks if an integer is even or odd. Core conditional logic.",
    difficulty: "BEGINNER",
    category: "Logic",
    rewardTokens: 10,
    timeLimit: 15,
    functionName: "isEven",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "Student Essential",
    starterCodeByLanguage: {
      javascript: `function isEven(num) {
  // Write your code here
  return num % 2 === 0;
}`,
      typescript: `function isEven(num: number): boolean {
  // Write your code here
  return num % 2 === 0;
}`,
      python: `def isEven(num):
    # Write your code here
    return num % 2 == 0`,
      java: `class Solution {
    public boolean isEven(int num) {
        // Write your code here
        return num % 2 == 0;
    }
}`,
    },
  },
  {
    id: "t3",
    title: "Reverse a String Sequence",
    description: "Write a function that reverses a given string. Common beginner string manipulation problem.",
    difficulty: "BEGINNER",
    category: "String Manipulation",
    rewardTokens: 15,
    timeLimit: 20,
    functionName: "reverseString",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "String Mastery",
    starterCodeByLanguage: {
      javascript: `function reverseString(str) {
  // Write your code here
  return str.split("").reverse().join("");
}`,
      typescript: `function reverseString(str: string): string {
  // Write your code here
  return str.split("").reverse().join("");
}`,
      python: `def reverseString(str):
    # Write your code here
    return str[::-1]`,
      java: `class Solution {
    public String reverseString(String str) {
        // Write your code here
        return new StringBuilder(str).reverse().toString();
    }
}`,
    },
  },
  {
    id: "t4",
    title: "Find Maximum Element in Array",
    description: "Write a function that traverses an array of numbers and returns the maximum value found.",
    difficulty: "INTERMEDIATE",
    category: "Array Operations",
    rewardTokens: 25,
    timeLimit: 25,
    functionName: "findMax",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "DSA Core",
    starterCodeByLanguage: {
      javascript: `function findMax(arr) {
  // Write your code here
  return Math.max(...arr);
}`,
      typescript: `function findMax(arr: number[]): number {
  // Write your code here
  return Math.max(...arr);
}`,
      python: `def findMax(arr):
    # Write your code here
    return max(arr)`,
      java: `class Solution {
    public int findMax(int[] arr) {
        // Write your code here
        int max = arr[0];
        for (int v : arr) {
            if (v > max) max = v;
        }
        return max;
    }
}`,
    },
  },
  {
    id: "t5",
    title: "Valid Palindrome with Alphanumeric Filtering",
    description: "Determine if a string is a palindrome after converting to lowercase and removing all non-alphanumeric characters. Classic university interview challenge.",
    difficulty: "BEGINNER",
    category: "String Manipulation",
    rewardTokens: 20,
    timeLimit: 20,
    functionName: "isPalindrome",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "Campus Placement Favorite",
    starterCodeByLanguage: {
      javascript: `function isPalindrome(s) {
  // Write your code here: return true if palindrome, ignoring non-alphanumerics & case
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}`,
      typescript: `function isPalindrome(s: string): boolean {
  // Write your code here
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}`,
      python: `def isPalindrome(s):
    # Write your code here
    clean = "".join(ch.lower() for ch in s if ch.isalnum())
    return clean == clean[::-1]`,
      java: `class Solution {
    public boolean isPalindrome(String s) {
        String clean = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        return clean.equals(new StringBuilder(clean).reverse().toString());
    }
}`,
    },
  },
  {
    id: "t6",
    title: "Two Sum: Target Pair Indices",
    description: "Given an integer array nums and an integer target, find two numbers that sum up to target and return their zero-based indices. Ideal for learning hash maps.",
    difficulty: "BEGINNER",
    category: "Algorithms",
    rewardTokens: 25,
    timeLimit: 25,
    functionName: "twoSum",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "Top LeetCode Classic",
    starterCodeByLanguage: {
      javascript: `function twoSum(nums, target) {
  // Write your code here: return [index1, index2]
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // Write your code here
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) return [map.get(comp)!, i];
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def twoSum(nums, target):
    # Write your code here
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
    return []`,
      java: `import java.util.*;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) return new int[]{map.get(comp), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
    },
  },
  {
    id: "t7",
    title: "Valid Parentheses & Syntax Validator",
    description: "Given a string containing '(', ')', '{', '}', '[' and ']', verify that brackets close in the correct order using a stack data structure.",
    difficulty: "INTERMEDIATE",
    category: "Data Structures",
    rewardTokens: 30,
    timeLimit: 25,
    functionName: "isValidParentheses",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "Stack Problem",
    starterCodeByLanguage: {
      javascript: `function isValidParentheses(s) {
  // Write your code here using a stack
  const stack = [];
  const pairs = { ")": "(", "}": "{", "]": "[" };
  for (const ch of s) {
    if (ch === "(" || ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (pairs[ch]) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
      typescript: `function isValidParentheses(s: string): boolean {
  // Write your code here
  const stack: string[] = [];
  const pairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };
  for (const ch of s) {
    if (ch === "(" || ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (pairs[ch]) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
      python: `def isValidParentheses(s):
    # Write your code here
    stack = []
    pairs = {")": "(", "}": "{", "]": "["}
    for ch in s:
        if ch in "({[":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return len(stack) == 0`,
      java: `import java.util.*;
class Solution {
    public boolean isValidParentheses(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') stack.push(c);
            else if (c == ')' && (stack.isEmpty() || stack.pop() != '(')) return false;
            else if (c == '}' && (stack.isEmpty() || stack.pop() != '{')) return false;
            else if (c == ']' && (stack.isEmpty() || stack.pop() != '[')) return false;
        }
        return stack.isEmpty();
    }
}`,
    },
  },
  {
    id: "t8",
    title: "Nth Fibonacci Number Calculation",
    description: "Return the nth Fibonacci number F(n) where F(0) = 0 and F(1) = 1. Focuses on dynamic programming and iterative time complexity.",
    difficulty: "BEGINNER",
    category: "Basic Math",
    rewardTokens: 15,
    timeLimit: 15,
    functionName: "fibonacci",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "Math & Recursion",
    starterCodeByLanguage: {
      javascript: `function fibonacci(n) {
  // Write your code here: return F(n)
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}`,
      typescript: `function fibonacci(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}`,
      python: `def fibonacci(n):
    if n <= 0: return 0
    if n == 1: return 1
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
      java: `class Solution {
    public int fibonacci(int n) {
        if (n <= 0) return 0;
        if (n == 1) return 1;
        int a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}`,
    },
  },
  {
    id: "t9",
    title: "Merge Two Sorted Arrays",
    description: "Given two sorted integer arrays arr1 and arr2, merge them into a single sorted array without duplicate logic flaws. Core two-pointer algorithm.",
    difficulty: "BEGINNER",
    category: "Array Operations",
    rewardTokens: 20,
    timeLimit: 20,
    functionName: "mergeSorted",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python", "java"],
    targetAudience: "STUDENT",
    badge: "Two Pointers",
    starterCodeByLanguage: {
      javascript: `function mergeSorted(arr1, arr2) {
  // Write your code here: return merged sorted array
  const res = [];
  let i = 0, j = 0;
  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] <= arr2[j]) res.push(arr1[i++]);
    else res.push(arr2[j++]);
  }
  while (i < arr1.length) res.push(arr1[i++]);
  while (j < arr2.length) res.push(arr2[j++]);
  return res;
}`,
      typescript: `function mergeSorted(arr1: number[], arr2: number[]): number[] {
  const res: number[] = [];
  let i = 0, j = 0;
  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] <= arr2[j]) res.push(arr1[i++]);
    else res.push(arr2[j++]);
  }
  while (i < arr1.length) res.push(arr1[i++]);
  while (j < arr2.length) res.push(arr2[j++]);
  return res;
}`,
      python: `def mergeSorted(arr1, arr2):
    # Write your code here
    return sorted(arr1 + arr2)`,
      java: `import java.util.*;
class Solution {
    public int[] mergeSorted(int[] arr1, int[] arr2) {
        int[] res = new int[arr1.length + arr2.length];
        int i = 0, j = 0, k = 0;
        while (i < arr1.length && j < arr2.length) {
            if (arr1[i] <= arr2[j]) res[k++] = arr1[i++];
            else res[k++] = arr2[j++];
        }
        while (i < arr1.length) res[k++] = arr1[i++];
        while (j < arr2.length) res[k++] = arr2[j++];
        return res;
    }
}`,
    },
  },

  // --- REAL-WORLD & WORKING PROFESSIONAL ASSESSMENTS ---
  {
    id: "t10",
    title: "Merge Overlapping Calendar Intervals",
    description: "Given an array of booking intervals [start, end], merge all overlapping intervals into non-overlapping blocks. Crucial for calendar, flight booking, and SaaS scheduling platforms.",
    difficulty: "ADVANCED",
    category: "Algorithms",
    rewardTokens: 40,
    timeLimit: 30,
    functionName: "mergeIntervals",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    targetAudience: "PROFESSIONAL",
    badge: "SaaS Scheduling Production Pattern",
    starterCodeByLanguage: {
      javascript: `function mergeIntervals(intervals) {
  // Write your code here: intervals is an array of [start, end]
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}`,
      typescript: `function mergeIntervals(intervals: number[][]): number[][] {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}`,
      python: `def mergeIntervals(intervals):
    if not intervals: return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for curr in intervals[1:]:
        last = merged[-1]
        if curr[0] <= last[1]:
            last[1] = max(last[1], curr[1])
        else:
            merged.append(curr)
    return merged`,
      java: `// Implement in JS, TS, or Python`,
    },
  },
  {
    id: "t11",
    title: "Deep Nested JSON Object Flattener",
    description: "Transform an arbitrarily nested JSON object into a flat dot-delimited key-value dictionary (e.g. { user: { city: 'Pune' } } -> { 'user.city': 'Pune' }). Required in modern telemetry, analytics, and ETL pipelines.",
    difficulty: "INTERMEDIATE",
    category: "Data Processing",
    rewardTokens: 35,
    timeLimit: 25,
    functionName: "flattenObject",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    targetAudience: "PROFESSIONAL",
    badge: "Data Pipeline & ETL Standard",
    starterCodeByLanguage: {
      javascript: `function flattenObject(obj, prefix = "", result = {}) {
  // Write your code here
  for (const key of Object.keys(obj)) {
    const propName = prefix ? prefix + "." + key : key;
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 0) {
      flattenObject(val, propName, result);
    } else {
      result[propName] = val;
    }
  }
  return result;
}`,
      typescript: `function flattenObject(obj: Record<string, any>, prefix = "", result: Record<string, any> = {}): Record<string, any> {
  for (const key of Object.keys(obj)) {
    const propName = prefix ? prefix + "." + key : key;
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 0) {
      flattenObject(val, propName, result);
    } else {
      result[propName] = val;
    }
  }
  return result;
}`,
      python: `def flattenObject(obj, prefix="", result=None):
    if result is None: result = {}
    for k, v in obj.items():
        p = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict) and v:
            flattenObject(v, p, result)
        else:
            result[p] = v
    return result`,
      java: `// Implement in JS, TS, or Python`,
    },
  },
  {
    id: "t12",
    title: "API Sliding Window Rate Limiter",
    description: "Write a rate limiter algorithm that determines whether a request at currentTimestamp should be allowed or rejected based on sliding window capacity. Found in Cloudflare, AWS API Gateway, and Stripe rate limiters.",
    difficulty: "ADVANCED",
    category: "System Design",
    rewardTokens: 45,
    timeLimit: 30,
    functionName: "isRateLimited",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    targetAudience: "PROFESSIONAL",
    badge: "Distributed Systems & API Gateway",
    starterCodeByLanguage: {
      javascript: `function isRateLimited(historyTimestamps, maxRequests, windowSeconds, currentTimestamp) {
  // Write your code here: return true if limited (rejected), false if allowed
  const windowStart = currentTimestamp - windowSeconds;
  let count = 0;
  for (const t of historyTimestamps) {
    if (t > windowStart && t <= currentTimestamp) {
      count++;
    }
  }
  return count >= maxRequests;
}`,
      typescript: `function isRateLimited(historyTimestamps: number[], maxRequests: number, windowSeconds: number, currentTimestamp: number): boolean {
  const windowStart = currentTimestamp - windowSeconds;
  let count = 0;
  for (const t of historyTimestamps) {
    if (t > windowStart && t <= currentTimestamp) {
      count++;
    }
  }
  return count >= maxRequests;
}`,
      python: `def isRateLimited(historyTimestamps, maxRequests, windowSeconds, currentTimestamp):
    window_start = currentTimestamp - windowSeconds
    count = sum(1 for t in historyTimestamps if window_start < t <= currentTimestamp)
    return count >= maxRequests`,
      java: `// Implement in JS, TS, or Python`,
    },
  },
  {
    id: "t13",
    title: "URL Query String Builder & Sanitizer",
    description: "Given an object of parameters, build a clean, URI-encoded URL query string with alphabetically sorted keys and omitting null, undefined, or empty values.",
    difficulty: "INTERMEDIATE",
    category: "Web Development",
    rewardTokens: 30,
    timeLimit: 20,
    functionName: "buildQueryString",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    targetAudience: "PROFESSIONAL",
    badge: "Full-Stack Utility",
    starterCodeByLanguage: {
      javascript: `function buildQueryString(params) {
  // Write your code here: return sorted, encoded query string
  const keys = Object.keys(params).sort();
  const parts = [];
  for (const k of keys) {
    const val = params[k];
    if (val !== null && val !== undefined && val !== "") {
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(val));
    }
  }
  return parts.join("&");
}`,
      typescript: `function buildQueryString(params: Record<string, any>): string {
  const keys = Object.keys(params).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const val = params[k];
    if (val !== null && val !== undefined && val !== "") {
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(val));
    }
  }
  return parts.join("&");
}`,
      python: `import urllib.parse
def buildQueryString(params):
    keys = sorted(params.keys())
    parts = []
    for k in keys:
        val = params[k]
        if val is not None and val != "":
            parts.append(f"{urllib.parse.quote(str(k))}={urllib.parse.quote(str(val))}")
    return "&".join(parts)`,
      java: `// Implement in JS, TS, or Python`,
    },
  },
  {
    id: "t14",
    title: "JWT Token Payload Extractor & Expiry Verifier",
    description: "Parse a base64-encoded JWT payload string, decode its JSON properties, and verify whether the token has expired against the given currentTimestamp. Returns true if valid and unexpired.",
    difficulty: "INTERMEDIATE",
    category: "Security & Auth",
    rewardTokens: 35,
    timeLimit: 25,
    functionName: "verifyTokenPayload",
    language: "javascript",
    supportedLanguages: ["javascript", "typescript", "python"],
    targetAudience: "PROFESSIONAL",
    badge: "Production Security & OAuth",
    starterCodeByLanguage: {
      javascript: `function verifyTokenPayload(payloadBase64, currentTimestamp) {
  // Write your code here
  try {
    const decoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
    if (!decoded.userId || !decoded.exp) return false;
    return decoded.exp > currentTimestamp;
  } catch {
    return false;
  }
}`,
      typescript: `function verifyTokenPayload(payloadBase64: string, currentTimestamp: number): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
    if (!decoded.userId || !decoded.exp) return false;
    return decoded.exp > currentTimestamp;
  } catch {
    return false;
  }
}`,
      python: `import json, base64
def verifyTokenPayload(payloadBase64, currentTimestamp):
    try:
        decoded = json.loads(base64.b64decode(payloadBase64).decode("utf-8"))
        if "userId" not in decoded or "exp" not in decoded:
            return False
        return decoded["exp"] > currentTimestamp
    except:
        return False`,
      java: `// Implement in JS, TS, or Python`,
    },
  },
];

export const mockTestCases: Record<string, MockTestCase[]> = {
  t1: [
    { args: [5, 3], expected: 8, description: "Sum of 5 and 3" },
    { args: [10, 20], expected: 30, description: "Sum of 10 and 20" },
    { args: [-5, 5], expected: 0, description: "Sum of -5 and 5", hidden: true },
  ],
  t2: [
    { args: [4], expected: true, description: "4 is even" },
    { args: [7], expected: false, description: "7 is odd" },
    { args: [0], expected: true, description: "0 is even", hidden: true },
  ],
  t3: [
    { args: ["hello"], expected: "olleh", description: "Reverse hello" },
    { args: ["world"], expected: "dlrow", description: "Reverse world" },
    { args: ["a"], expected: "a", description: "Reverse single char", hidden: true },
  ],
  t4: [
    { args: [[3, 7, 2, 9, 1]], expected: 9, description: "Max of array" },
    { args: [[10, 20, 15]], expected: 20, description: "Max of 10,20,15" },
    { args: [[-5, -2, -10]], expected: -2, description: "Max of negatives", hidden: true },
  ],
  t5: [
    { args: ["A man, a plan, a canal: Panama"], expected: true, description: "Standard palindrome with spaces and punctuation" },
    { args: ["race a car"], expected: false, description: "Non-palindrome string" },
    { args: ["Was it a car or a cat I saw?"], expected: true, description: "Mixed case question palindrome" },
    { args: ["No 'x' in Nixon"], expected: true, description: "Single quotes and uppercase", hidden: true },
  ],
  t6: [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1], description: "Target 9 with elements at 0 and 1" },
    { args: [[3, 2, 4], 6], expected: [1, 2], description: "Target 6 with elements at 1 and 2" },
    { args: [[3, 3], 6], expected: [0, 1], description: "Target 6 with identical values", hidden: true },
  ],
  t7: [
    { args: ["()[]{}"], expected: true, description: "Balanced sequential parentheses" },
    { args: ["(]"], expected: false, description: "Mismatched bracket pair" },
    { args: ["([{}])"], expected: true, description: "Deeply nested balanced brackets" },
    { args: ["((("], expected: false, description: "Unclosed open brackets", hidden: true },
  ],
  t8: [
    { args: [6], expected: 8, description: "F(6) = 8" },
    { args: [10], expected: 55, description: "F(10) = 55" },
    { args: [0], expected: 0, description: "F(0) = 0", hidden: true },
    { args: [1], expected: 1, description: "F(1) = 1", hidden: true },
  ],
  t9: [
    { args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6], description: "Interleaved sorted arrays" },
    { args: [[0], [1]], expected: [0, 1], description: "Single element arrays" },
    { args: [[], [2, 5]], expected: [2, 5], description: "One empty array", hidden: true },
  ],
  t10: [
    { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]], description: "Merge overlapping [1,3] and [2,6]" },
    { args: [[[1, 4], [4, 5]]], expected: [[1, 5]], description: "Merge adjacent intervals [1,4] and [4,5]" },
    { args: [[[6, 8], [1, 9], [2, 4]]], expected: [[1, 9]], description: "Completely encompassed intervals", hidden: true },
  ],
  t11: [
    { args: [{ user: { name: "Aarav", location: { city: "Bengaluru" } } }], expected: { "user.name": "Aarav", "user.location.city": "Bengaluru" }, description: "Flatten 2-level nested object" },
    { args: [{ a: 1, b: { c: 2 } }], expected: { a: 1, "b.c": 2 }, description: "Mix of top-level and nested properties" },
    { args: [{ company: { dev: { team: "Platform" } } }], expected: { "company.dev.team": "Platform" }, description: "3-level deep nesting", hidden: true },
  ],
  t12: [
    { args: [[10, 15, 20], 3, 60, 25], expected: true, description: "3 requests in 60s window: limit reached (true)" },
    { args: [[10, 15, 20], 5, 60, 25], expected: false, description: "3 requests in 60s with max 5: allowed (false)" },
    { args: [[5, 10, 20, 80], 3, 30, 85], expected: false, description: "Older timestamps outside 30s window discarded", hidden: true },
  ],
  t13: [
    { args: [{ search: "react hooks", page: 1, filter: null }], expected: "page=1&search=react%20hooks", description: "Omit null value and sort keys alphabetically" },
    { args: [{ category: "ai", sort: "desc" }], expected: "category=ai&sort=desc", description: "Simple query parameters" },
    { args: [{ empty: null, undefined: undefined, valid: 100 }], expected: "valid=100", description: "Filter both null and undefined", hidden: true },
  ],
  t14: [
    { args: ["eyJ1c2VySWQiOiJ1MTIzIiwiZXhwIjoxODAwMDAwMDAwfQ==", 1700000000], expected: true, description: "Valid unexpired token (exp 1800000000 > current 1700000000)" },
    { args: ["eyJ1c2VySWQiOiJ1MTIzIiwiZXhwIjoxNjAwMDAwMDAwfQ==", 1700000000], expected: false, description: "Expired token (exp 1600000000 < current 1700000000)" },
    { args: ["invalid_base64_payload", 1700000000], expected: false, description: "Malformed payload returns false safely", hidden: true },
  ],
};

export function getStarterCode(task: MockTask, language: SupportedLanguage) {
  return task.starterCodeByLanguage[language] ?? task.starterCodeByLanguage[task.language];
}
