const coursesData = [
  {
    category: "Robotics, Dynamics, and Control",
    courses: [
      {
        name: "Robot Devices, Kinematics, Dynamics, and Control (EN.530.646)",
        instructor: "Jin Seob Kim (Fall 2025 offering)",
        school: "Johns Hopkins University (Mechanical Engineering, WSE)",
        description:
          "Graduate intro to robotic mechanics with kinematics/dynamics tools for arms and mobile robots, plus trajectory generation and control basics.",
      },
      {
        name: "Locomotion Mechanics: Fundamentals (EN.530.668)",
        instructor: "Chen Li (Fall 2025 offering)",
        school: "Johns Hopkins University (Mechanical Engineering, WSE)",
        description:
          "Mechanics of locomotion for animals and machines, emphasizing bio-inspired robots and how forces, body dynamics, and environment interactions shape movement.",
      },
      {
        name: "Learning, Estimation and Control (EN.580.691)",
        instructor: "Reza Shadmehr (recent offerings)",
        school: "Johns Hopkins University (Biomedical Engineering, WSE)",
        description:
          "Probabilistic foundations of learning theory covering estimation, Kalman filters, Bayesian learning, classification, reinforcement learning, and active learning with an iterative focus.",
      },
    ],
  },
  {
    category: "Haptics and Human-Robot Interaction",
    courses: [
      {
        name: "Haptic Interface Design for Human-Robot Interaction (EN.530.691)",
        instructor: "Jeremy Brown (recent offerings)",
        school: "Johns Hopkins University (Mechanical Engineering, WSE)",
        description:
          "Haptic interface design and analysis for VR/AR and teleoperation, including touch perception, mechatronic design, modeling, and human-in-the-loop control.",
      },
      {
        name: "Human-Robot Interaction (EN.601.691)",
        instructor: "Chien-Ming Huang (listed as \"Huang\" in CS scheduling)",
        school: "Johns Hopkins University (Computer Science, WSE)",
        description:
          "Research methods and core topics in HRI, focused on designing and evaluating interactive robot systems through readings, assignments, and a substantial project.",
      },
    ],
  },
  {
    category: "Machine Learning and Data",
    courses: [
      {
        name: "Applied Machine Learning for Mechanical Engineers (EN.535.742)",
        instructor: "Mohammad Hossein Rafiei (recent offerings)",
        school: "Johns Hopkins University (Engineering for Professionals)",
        description:
          "Applied ML workflow for engineering problems, typically covering supervised learning foundations and practical modeling approaches used in mechanical engineering contexts.",
      },
      {
        name: "Biomedical Data Analytics (BENG 520)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Practical methods for biomedical data analysis (classification, regression, clustering, dimensionality reduction) with hands-on work interpreting real biological/biomedical datasets.",
      },
      {
        name: "Probabilistic Machine Learning (ECE 657)",
        instructor: "Varies by semester",
        school: "George Mason University (Electrical and Computer Engineering)",
        description:
          "Probabilistic models for ML, starting from Bayesian decision theory and moving through graphical models, HMMs, MCMC, particle filters, and related inference tools.",
      },
    ],
  },
  {
    category: "Biomechanics, Neuro, and Rehabilitation",
    courses: [
      {
        name: "Biomechanics of Human Movement (EN.535.667)",
        instructor: "Mohsen Bayat (Fall 2025 offering)",
        school: "Johns Hopkins University (Engineering for Professionals)",
        description:
          "Human movement biomechanics with emphasis on understanding and modeling motion, forces, and the mechanical principles behind gait and motor tasks.",
      },
      {
        name: "Neural and Rehabilitation Engineering (EN.580.656)",
        instructor: "Nitish Thakor (recent offerings)",
        school: "Johns Hopkins University (Biomedical Engineering, WSE)",
        description:
          "Engineering solutions for neural and physical disabilities, spanning prosthetics, biosignals, sensing, and sensory feedback for rehab technologies.",
      },
    ],
  },
  {
    category: "Sustainability, Policy, and Ethics",
    courses: [
      {
        name: "Sustainability Science and Policy (EN.570.667)",
        instructor: "Not consistently listed publicly (varies by term)",
        school: "Johns Hopkins University (Environmental Health & Engineering)",
        description:
          "Survey of sustainability challenges with a policy lens, linking scientific foundations to decisions in energy, environment, and governance.",
      },
      {
        name: "AI: Ethics, Policy, and Society (ME 576)",
        instructor: "Varies by semester",
        school: "George Mason University (Mechanical Engineering)",
        description:
          "Ethical and governance questions around AI, including privacy, surveillance, misinformation, fairness and bias, accountability, trust, and real-world policy tradeoffs.",
      },
      {
        name: "Intellectual Property, Regulatory Concepts and Product Development (BENG 575)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Patents and the IP process, FDA and regulatory pathways, plus product development from concept to quality systems and go-to-market planning.",
      },
    ],
  },
  {
    category: "Design, Devices, and Translation",
    courses: [
      {
        name: "RS: Senior Advanced Design Project II (BENG 493)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Capstone build-and-test course: refine a prototype, improve hardware and software, run experiments, validate performance, and deliver presentations and reports.",
      },
      {
        name: "Medical Image Processing (BENG 437)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Core image processing techniques tailored to medical imaging problems including enhancement, restoration, and foundational workflows.",
      },
      {
        name: "Neural Engineering (BENG 526)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Neuroengineering fundamentals with emphasis on neural measurement and analysis and engineering approaches to interfacing with neural systems.",
      },
      {
        name: "Cell and Tissue Engineering (BENG 521)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Principles of tissue engineering including biomaterials, cell behavior, scaffold design, and strategies for building functional tissue constructs.",
      },
      {
        name: "Translational Bioengineering (BENG 551)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Translating bioengineering innovations toward real impact, including the practical constraints of development, validation, and adoption.",
      },
      {
        name: "Biomanufacturing (BENG 615)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Biopharma manufacturing pipeline including upstream and downstream processes, formulation, fill-finish, and quality systems for safety and potency.",
      },
    ],
  },
  {
    category: "Research and Professional Practice",
    courses: [
      {
        name: "Seminar in Computational Sensing and Robotics (EN.500.745)",
        instructor: "Louis Whitcomb and Peter Kazanzides (listed on ME course schedules)",
        school: "Johns Hopkins University (WSE)",
        description:
          "Research seminar series with talks across robotics, sensing, and systems designed to build research literacy and exposure to active work in the field.",
      },
      {
        name: "MSE Graduate Research (EN.530.823)",
        instructor: "Your research advisor (by arrangement)",
        school: "Johns Hopkins University (Mechanical Engineering, WSE)",
        description:
          "Credit-bearing research work under faculty supervision, often used to deepen a focused project and complete required research training modules.",
      },
      {
        name: "Responsible Conduct of Research (Online) (AS.360.624)",
        instructor: "Online module (no SIS registration required)",
        school: "Johns Hopkins University",
        description:
          "Online RCR training that posts to your transcript after completion and focuses on research integrity basics.",
      },
      {
        name: "Responsible Conduct of Research (AS.360.625)",
        instructor: "Varies by offering",
        school: "Johns Hopkins University",
        description:
          "Discussion-based RCR mini-course covering research ethics, conflicts of interest, data management, authorship, and human or animal subjects.",
      },
      {
        name: "Research Laboratory Safety (EN.500.601)",
        instructor: "Varies by offering",
        school: "Johns Hopkins University (General Engineering, WSE)",
        description:
          "Lab safety using the RAMP framework across physical, chemical, radiation, and biological hazards and safer experiment design.",
      },
      {
        name: "Graduate Academic Ethics (EN.500.603)",
        instructor: "Online module (embedded in WSE orientation)",
        school: "Johns Hopkins University (WSE)",
        description:
          "Required academic ethics training module and quiz added to SIS for graduate students.",
      },
      {
        name: "Collaborative Bioengineering Basic Science Research (BENG 601)",
        instructor: "Varies by semester",
        school: "George Mason University (Bioengineering)",
        description:
          "Research exposure course connecting new graduate students to interdisciplinary bioengineering research themes, labs, and faculty across institutions.",
      },
      {
        name: "Graduate Practicum (BENG 797)",
        instructor: "Practicum supervisor + advisor approval",
        school: "George Mason University (Bioengineering)",
        description:
          "Experiential learning on real-world bioengineering problems, often with industry partners or Mason labs, requiring advisor approval.",
      },
    ],
  },
];

const PROJECTS = [
  {
    id: "clinibooth",
    category: ["Healthcare", "Startup", "Prototyping"],
    title: "Clinibooth Telemedicine Diagnostic Booth",
    blurb:
      "Designed and assembled a working telemedicine booth prototype to bring essential diagnostics to underserved communities.",
    cover: "assets/projects/clinibooth/cover.png",
    media: [
      { type: "image", src: "assets/projects/clinibooth/1.png" },
      { type: "image", src: "assets/projects/clinibooth/2.png" },
      { type: "image", src: "assets/projects/clinibooth/3.png" },
    ],
    what:
      "Clinibooth builds compact telemedicine booths that let patients access essential diagnostics in places like pharmacies and community centers. The prototype integrates multiple devices with a guided patient flow and remote clinician oversight.",
    why:
      "It makes primary-care access more scalable by reducing friction for patients while keeping clinicians in the loop.",
    highlights: [
      "Designed and iterated mechanical mounts and device holders for fast integration",
      "Improved ergonomics, security, and cable management for patient use",
      "Assembled and validated the booth in a fast-paced startup environment",
    ],
    tech: ["Onshape", "Fusion 360", "3D Printing (FDM)", "Prototyping", "Device Integration"],
    links: [
      { label: "Read report (PDF)", url: "assets/pdfs/clinibooth-report.pdf" },
      { label: "Visit Clinibooth", url: "https://www.clinibooth.com/en/solutions" },
    ],
  },
  {
    id: "harvard-fluidic-window",
    category: ["Research", "Energy", "Materials", "Thermal Testing"],
    title: "Dynamic Fluidic Window Systems for Energy-Efficient Indoor Climate Control",
    blurb:
      "Adaptive fluidic window concept to control sunlight intensity, direction, and color to reduce building energy use.",
    cover: "assets/projects/harvard-fluidic-window/cover.png",
    media: [
      { type: "image", src: "assets/projects/harvard-fluidic-window/IMG_3978.png" },
      { type: "image", src: "assets/projects/harvard-fluidic-window/IMG_3979.png" },
      { type: "image", src: "assets/projects/harvard-fluidic-window/IMG_3981.png" },
      { type: "image", src: "assets/projects/harvard-fluidic-window/IMG_3984.png" },
      { type: "image", src: "assets/projects/harvard-fluidic-window/IMG_4165.png" },
    ],
    metaLine: "Wyss Institute for Biologically Inspired Engineering | Harvard University",
    overviewParagraph:
      "Buildings consume enormous energy for heating, cooling, and lighting. We explored a fluidic window system that uses liquid control to tune sunlight intensity, direction, and color, aiming to reduce energy demand while improving indoor comfort.",
    irParagraph:
      "IR testing used a military-grade infrared camera. The left image shows an IR heat map of the device, while the right shows the camera and capture/analysis station. The setup provided qualitative thermal response insight across varying heat conditions.",
    highlights: [
      "Sunlight control across intensity, direction, and color",
      "Designed for shifting weather and thermal conditions",
      "Goal: reduce HVAC and lighting load at building scale",
    ],
    tech: ["Research", "Energy systems", "Materials", "Thermal testing"],
  },
  {
    id: "haptic-belt",
    category: ["Haptics", "Wearables"],
    title: "Multi-Directional Haptic Feedback Belt",
    blurb:
      "Built a wearable belt that encodes direction and distance using vibrotactile cues for indoor navigation.",
    cover: "assets/projects/haptic-belt/cover.png",
    media: [
      { type: "image", src: "assets/projects/haptic-belt/1.png" },
      { type: "image", src: "assets/projects/haptic-belt/2.png" },
      { type: "youtube", id: "5pgo9ENCGuw", title: "Haptic belt demo" },
    ],
    what:
      "A wearable belt that turns heading and range into intuitive vibration patterns so users can navigate without relying on vision or audio.",
    why:
      "It explores how simple haptic cues can improve mobility and independence in noisy or attention-limited settings.",
    highlights: [
      "Directional feedback using four waist-mounted ERM motors",
      "Real-time UWB ranging plus IMU yaw for heading-aligned cues",
      "Smoothed motor blending with distance-based intensity scaling",
    ],
    tech: ["ESP32", "UWB", "IMU", "Embedded firmware", "Haptics"],
    links: [
      { label: "Read report (PDF)", url: "assets/pdfs/haptic-belt-paper.pdf" },
    ],
  },
  {
    id: "hydrogel-desalination",
    category: ["Healthcare", "Sustainability", "Design"],
    title: "Utilizing Hydrogels for Energy-Efficient Desalination",
    subtitle: "BENG 493 Senior Advanced Design (Team 1)",
    blurb:
      "Solar-driven hydrogel desalination prototype designed for off-grid clean water production.",
    cover: "assets/projects/hydrogel/cover.png",
    media: [
      { type: "image", src: "assets/projects/hydrogel/1.jpeg" },
      { type: "image", src: "assets/projects/hydrogel/2.jpeg" },
      { type: "image", src: "assets/projects/hydrogel/3.jpeg" },
    ],
    metaLine:
      "Saltans - Team 1 | BENG 493 - Senior Advanced Design Project 1 | Dr. Shani Ross | 05/03/2024",
    reportLink: { label: "Read report (PDF)", url: "assets/pdfs/hydrogel-desalination-report.pdf" },
    overviewParagraph:
      "Clean water is critical, yet traditional desalination is expensive and energy-intensive. We built a solar-heated hydrogel filter (chitosan + PVA + PPy) that evaporates and condenses water into drinkable output with no electricity, targeting off-grid use.",
    builtBullets: [
      "Solar-powered desalination and purification prototype",
      "Hydrogel filter: chitosan + PVA + PPy with crosslinking",
      "Condensation-based collection into a reservoir",
      "Prototype materials: ABS/acrylic; long-term direction: 316 stainless steel",
    ],
    resultsBullets: [
      "Roughly 3-4 L/hr per m2 (scaled estimate)",
      "Salt and metal impurities (copper/lead/iron) reached 0 ppm on strips",
      "Hydrogel durability: at least ~3 months in 3.5% salinity with promising signs toward longer life",
      "Bench tests included long-term hydration, swell ratio, rheology, SEM, and evaporation testing",
    ],
  },
  {
    id: "haptics-cross-modal",
    category: ["Haptics", "Research", "Perception"],
    title: "Haptics: Cross-Modal Matching Projects",
    blurb:
      "Two related studies on how people align intensity across vision, vibration, and pressure cues.",
    cover: "assets/projects/haptics-cross-modal/cover.png",
    media: [
      { type: "image", src: "assets/projects/haptics-cross-modal/1.png" },
      { type: "image", src: "assets/projects/haptics-cross-modal/2.png" },
    ],
    what:
      "A paired set of experiments exploring how users map perceived intensity across different feedback channels in a controlled pinch interaction.",
    why:
      "The results inform how to design multisensory haptic systems without assuming all tactile channels behave the same.",
    highlights: [
      "Designed participant-friendly tasks with clean, analysis-ready data capture",
      "Measured consistency across cross-domain vs within-domain mappings",
      "Focused on interpretable metrics for perception-driven design decisions",
    ],
    tech: ["Experimental design", "Haptics", "Human-in-the-loop systems", "Data analysis"],
    subprojects: [
      {
        title: "Cross-Modal Matching (CMM) Pinch Task",
        goal:
          "Study how users match perceived intensity across vision, vibration, and pressure during a pinch task.",
        did:
          "Built a repeatable setup and refined procedures to keep trials consistent and comfortable for participants.",
        tools: ["Haptics", "Instrumentation", "User study design"],
      },
      {
        title: "Cross-Domain Surpasses Within-Domain Matching",
        goal:
          "Compare cross-domain (vision-vibration) and within-domain (pressure-vibration) matching consistency.",
        did:
          "Supported analysis and interpretation of error metrics and consistency trends to guide design implications.",
        tools: ["Perception research", "Quantitative analysis", "Scientific writing"],
      },
    ],
    links: [],
  },
  {
    id: "ur5-push-place",
    category: ["Robotics", "Controls"],
    title: "UR5(e) Push-and-Place Manipulation",
    blurb:
      "Programmed a UR5(e) to run a push-and-place task using both resolved-rate control and inverse kinematics.",
    cover: "assets/projects/ur5-push-place/cover.png",
    model: "assets/models/ur5.glb",
    media: [
      { type: "youtube", id: "_O1o6v7AymE", title: "UR5 push-and-place demo" },
    ],
    what:
      "A push-and-place routine in SE(3) implemented with two control strategies so their behavior can be compared under the same task constraints.",
    why:
      "It highlights the practical tradeoffs between resolved-rate control and waypoint-based IK in real manipulation tasks.",
    highlights: [
      "SE(3) keyframe planning for contact, lift, translate, and return",
      "Resolved-rate control using Jacobian-based twist error",
      "IK solution selection to avoid discontinuous joint flips",
      "Safety checks for singularities and table collisions",
    ],
    tech: ["MATLAB", "Robot kinematics", "Jacobian control", "Inverse kinematics"],
    links: [
      { label: "Read report (PDF)", url: "assets/pdfs/ur5-push-place-report.pdf" },
    ],
  },
  {
    id: "migraine-wave",
    category: ["Healthcare", "Data", "Human-Centered Design"],
    title: "MigraineWave: A Private Migraine Journal for Mac",
    blurb:
      "A native macOS app for logging migraine episodes, tracking medication use, and exploring recorded patterns over time.",
    cover: "assets/projects/migraine-app/01-today.jpg",
    media: [
      { type: "image", src: "assets/projects/migraine-app/01-today.jpg", alt: "Daily overview: a clear starting point for recent activity, summary metrics, and daily logging." },
      { type: "image", src: "assets/projects/migraine-app/05-insights.jpg", alt: "Visualize trends: review severity over time and summary statistics across a selected date range." },
      { type: "image", src: "assets/projects/migraine-app/02-quick-log.jpg", alt: "Record an episode: capture pain severity and context through dedicated logging controls." },
      { type: "image", src: "assets/projects/migraine-app/03-history.jpg", alt: "Revisit the record: browse and filter earlier entries, then open a record to review its details." },
      { type: "image", src: "assets/projects/migraine-app/04-medications.jpg", alt: "Medication history: keep medication timing and dose records in a dedicated view." },
      { type: "image", src: "assets/projects/migraine-app/06-reports-settings.jpg", alt: "Reports and data: prepare a doctor-report PDF and export records for use outside the app." },
      { type: "youtube", id: "OzfOmHlkw-Y", title: "MigraineWave demo" },
    ],
    mediaNote: "Screenshots use fictional demonstration data.",
    what:
      "A native Mac app built around a simple workflow: record an episode, add context, and review patterns over time. The Today screen brings recent activity and a severity input into one place, while dedicated History, Medications, and Insights sections support more detailed review.",
    why:
      "Instead of scattered notes, MigraineWave organizes severity, timing, possible triggers, duration, and medication use in one calm, private workspace, making records easier to revisit and to summarize for a clinician visit. Its charts summarize what the user entered; they do not diagnose or establish causes.",
    highlights: [
      "Daily logging of timestamp and pain severity, with optional symptom, food, activity, trigger, duration, and medication details",
      "At-a-glance dashboard of recent frequency, average severity, medication use, and commonly recorded triggers",
      "Searchable, filterable, editable history plus dedicated medication dose records linked to migraine entries",
      "Insights on severity trends, frequency, time-of-day patterns, triggers, and a calendar view across selectable date ranges",
      "CSV and JSON export and a printable doctor-report PDF",
      "Local-only storage on the Mac: no login, cloud sync, analytics, or network calls",
    ],
    tech: [
      "Swift",
      "SwiftUI",
      "SwiftData",
      "Swift Charts",
      "AppKit",
      "Swift Package Manager",
      "macOS 14+",
    ],
    links: [
      { label: "Watch demo", url: "https://youtu.be/OzfOmHlkw-Y" },
    ],
  },
  {
    id: "bike-hmm-bikeshare",
    category: ["Machine Learning", "Probabilistic ML", "Data"],
    title: "Uncovering Hidden Mobility Regimes in Capital Bikeshare Data",
    subtitle: "Hidden Markov Models + Bayesian Inference",
    blurb:
      "Used HMMs to uncover demand regimes and Bayesian regression to forecast ridership with uncertainty (2021-2024).",
    cover: "assets/projects/bike-hmm/cover.png",
    media: [
      { type: "image", src: "assets/projects/bike-hmm/1.png" },
      { type: "image", src: "assets/projects/bike-hmm/2.png" },
      { type: "image", src: "assets/projects/bike-hmm/3.png" },
      { type: "image", src: "assets/projects/bike-hmm/4.png" },
      { type: "image", src: "assets/projects/bike-hmm/5.png" },
    ],
    what:
      "Modeled Capital Bikeshare ridership as a switching system with hidden regimes, then built a Bayesian forecasting model to predict hourly demand with uncertainty.",
    why:
      "The approach yields interpretable demand states and uncertainty-aware forecasts that are more useful than single-point predictions.",
    highlights: [
      "Latent regime discovery with HMMs and interpretable state transitions",
      "Bayesian regression with posterior predictive intervals",
      "Model comparison using log-likelihood, AIC, and BIC",
      "Feature engineering with time, calendar, and weather data",
    ],
    tech: ["Python", "Hidden Markov Models", "Bayesian Inference (MCMC)", "AIC/BIC"],
    links: [
      { label: "Read report (PDF)", url: "assets/pdfs/bike-hmm-bikeshare.pdf" },
    ],
  },
];

const PROJECT_FILTERS = ["All", "Haptics", "Robotics", "Healthcare", "Data", "Machine Learning"];

const GALLERY_IMAGES = [
  { src: "assets/images/gallery/graduation-hackerman-hall.png", alt: "Graduation photo in front of Hackerman Hall" },
  { src: "assets/images/gallery/graduation-in-the-lab.png", alt: "In graduation robes, working at a laptop in the lab" },
  { src: "assets/images/gallery/vanderbilt-graduate-school.png", alt: "At the Vanderbilt Graduate School welcome sign" },
  { src: "assets/images/gallery/create-lab-outreach.png", alt: "CREATE lab outreach table with prostheses and an exosuit" },
  { src: "assets/images/gallery/haptics-lab-experiment.png", alt: "Running a haptics experiment at a lab workstation" },
  "assets/images/gallery/443B1D15-FF20-46BA-8F67-F5869B61B8DB.png",
  "assets/images/gallery/84425.png",
  "assets/images/gallery/G0061829.png",
  "assets/images/gallery/IMG_0108.png",
  "assets/images/gallery/IMG_1480.png",
  "assets/images/gallery/IMG_3062.png",
  "assets/images/gallery/IMG_3098.png",
  "assets/images/gallery/IMG_4376.png",
  "assets/images/gallery/IMG_4557.png",
  "assets/images/gallery/IMG_4558.png",
  "assets/images/gallery/IMG_5881.png",
  "assets/images/gallery/IMG_7080.png",
  "assets/images/gallery/IMG_7189.png",
  "assets/images/gallery/IMG_7561.png",
  "assets/images/gallery/IMG_7780.png",
  "assets/images/gallery/IMG_8022.png",
  "assets/images/gallery/IMG_9671.png",
];

function getOptimizedImagePath(src) {
  if (!src || typeof src !== "string") return src;
  if (!src.startsWith("assets/")) return src;
  if (!/\.(png|jpe?g)$/i.test(src)) return src;
  return src.replace(/^assets\//, "assets/optimized/").replace(/\.(png|jpe?g)$/i, ".jpg");
}

function getResponsiveImageCandidates(src) {
  const optimizedSrc = getOptimizedImagePath(src);
  if (optimizedSrc === src) {
    return [];
  }

  return [480, 960, 1440].map((width) => ({
    src: optimizedSrc.replace(/\.jpg$/i, `-${width}.jpg`),
    width,
  }));
}

function setImageSourceWithFallback(img, src, options = {}) {
  const { onHardFailure, sizes } = options;
  const optimizedSrc = getOptimizedImagePath(src);
  let fallbackAttempted = false;
  img.decoding = "async";
  const candidates = getResponsiveImageCandidates(src);

  if (candidates.length) {
    img.srcset = `${candidates.map((candidate) => `${candidate.src} ${candidate.width}w`).join(", ")}, ${optimizedSrc} 1800w`;
  } else {
    img.removeAttribute("srcset");
  }

  if (sizes) {
    img.sizes = sizes;
  } else {
    img.removeAttribute("sizes");
  }

  img.onerror = () => {
    // Originals are not deployed, so fall back to the full-size optimized copy.
    if (!fallbackAttempted && candidates.length) {
      fallbackAttempted = true;
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.src = optimizedSrc;
      return;
    }
    if (typeof onHardFailure === "function") {
      onHardFailure();
    }
  };
  img.src = candidates[1]?.src || candidates[0]?.src || optimizedSrc;
}

const FEATURED_PROJECT_IDS = ["haptic-belt", "ur5-push-place", "clinibooth", "harvard-fluidic-window"];

const HOME_FILM = [
  "assets/images/gallery/IMG_0108.png",
  "assets/images/gallery/create-lab-outreach.png",
  "assets/images/gallery/G0061829.png",
  "assets/images/gallery/IMG_3098.png",
  "assets/images/gallery/IMG_7080.png",
  "assets/images/gallery/vanderbilt-graduate-school.png",
  "assets/images/gallery/IMG_8022.png",
  "assets/images/gallery/haptics-lab-experiment.png",
  "assets/images/gallery/IMG_9671.png",
  "assets/images/gallery/graduation-hackerman-hall.png",
];

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitCourseName(name) {
  const match = name.match(/^(.*?)\s*\(([^()]*\d[^()]*)\)\s*$/);
  return match ? { title: match[1], code: match[2] } : { title: name, code: "" };
}

function createCourseCard(course) {
  const card = document.createElement("div");
  card.className = "course-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-pressed", "false");
  card.setAttribute("aria-label", `Flip card for ${course.name}`);

  const schoolTag = course.school.includes("Johns Hopkins University")
    ? "JHU"
    : course.school.includes("George Mason University")
      ? "GMU"
      : "School";
  const { title, code } = splitCourseName(course.name);

  const inner = document.createElement("div");
  inner.className = "course-card-inner";

  const front = document.createElement("div");
  front.className = "course-card-face course-card-front";
  front.innerHTML = `
    <span class="course-code">${code || schoolTag}</span>
    <h3 class="clamp-3">${title}</h3>
    <p class="course-instructor clamp-2">${course.instructor}</p>
    <div class="course-footer">
      <div class="course-tag">${schoolTag}</div>
      <div class="course-hint">Flip ↻</div>
    </div>
  `;

  const back = document.createElement("div");
  back.className = "course-card-face course-card-back";
  back.innerHTML = `
    <span class="course-code">${code || schoolTag}</span>
    <p class="course-school clamp-1">${course.school}</p>
    <p class="course-desc clamp-4">${course.description}</p>
    <div class="course-footer">
      <div class="course-hint">Flip back ↺</div>
    </div>
  `;

  inner.appendChild(front);
  inner.appendChild(back);
  card.appendChild(inner);

  function toggleFlip() {
    const isFlipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(isFlipped));
  }

  card.addEventListener("click", toggleFlip);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  });

  return card;
}

function renderCourses() {
  const root = document.getElementById("courses-root");
  if (!root) return;

  coursesData.forEach((section, index) => {
    const wrapper = document.createElement("section");
    wrapper.className = "courses-category";
    wrapper.setAttribute("data-reveal", "");

    const title = document.createElement("h2");
    title.innerHTML = `<small>${String(index + 1).padStart(2, "0")} · ${section.courses.length} courses</small>`;
    title.appendChild(document.createTextNode(section.category));
    wrapper.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "courses-grid";

    section.courses.forEach((course) => {
      grid.appendChild(createCourseCard(course));
    });

    wrapper.appendChild(grid);
    root.appendChild(wrapper);
  });
}

function createTag(label) {
  const span = document.createElement("span");
  span.className = "project-tag";
  span.textContent = label;
  return span;
}

function createLink(link) {
  const a = document.createElement("a");
  a.className = "link-button";
  if (link.label.toLowerCase().includes("read")) {
    a.classList.add("secondary");
  }
  a.href = link.url;
  a.textContent = link.label;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function createSectionTitle(text) {
  const title = document.createElement("h4");
  title.className = "project-section-title";
  title.textContent = text;
  return title;
}

function createBulletSection(titleText, items) {
  const section = document.createElement("div");
  section.className = "project-section";
  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  section.appendChild(createSectionTitle(titleText));
  section.appendChild(list);
  return section;
}

function createParagraphSection(titleText, text) {
  const section = document.createElement("div");
  section.className = "project-section";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  section.appendChild(createSectionTitle(titleText));
  section.appendChild(paragraph);
  return section;
}

// Everything a project says about itself, used inside the detail sheet.
function buildProjectDetail(project) {
  const body = document.createElement("div");
  body.className = "project-panel-inner";

  if (project.media && project.media.length) {
    const gallery = document.createElement("div");
    gallery.className = "project-gallery";
    const imageSources = project.media.filter((item) => item.type === "image").map((item) => item.src);
    project.media.forEach((item) => {
      const mediaItem = document.createElement("div");
      mediaItem.className = "project-gallery-item";
      if (item.type === "video") {
        const video = document.createElement("video");
        video.src = item.src;
        video.controls = true;
        video.playsInline = true;
        video.preload = "none";
        mediaItem.appendChild(video);
      } else if (item.type === "youtube") {
        const iframe = document.createElement("iframe");
        const videoId = item.id || "";
        iframe.src = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : item.src;
        iframe.title = item.title || `${project.title} video`;
        iframe.loading = "lazy";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        mediaItem.appendChild(iframe);
      } else {
        const img = document.createElement("img");
        img.alt = item.alt || `${project.title} media`;
        img.loading = "lazy";
        setImageSourceWithFallback(img, item.src, {
          sizes: "(max-width: 720px) 92vw, 460px",
        });
        img.addEventListener("click", () =>
          openLightbox(imageSources, imageSources.indexOf(item.src), project.title),
        );
        mediaItem.appendChild(img);
      }
      gallery.appendChild(mediaItem);
    });
    body.appendChild(gallery);
    if (project.mediaNote) {
      const mediaNote = document.createElement("p");
      mediaNote.className = "project-meta-line";
      mediaNote.textContent = project.mediaNote;
      body.appendChild(mediaNote);
    }
  }

  if (project.overviewParagraph) {
    body.appendChild(createParagraphSection("Overview", project.overviewParagraph));
  }
  if (project.irParagraph) {
    body.appendChild(createParagraphSection("IR testing setup", project.irParagraph));
  }
  if (project.builtBullets) {
    body.appendChild(createBulletSection("What we built", project.builtBullets));
  }
  if (project.resultsBullets) {
    body.appendChild(createBulletSection("Key validation + results", project.resultsBullets));
  }

  if (project.what || project.why) {
    const textBlock = document.createElement("div");
    textBlock.className = "project-text";
    if (project.what) {
      const what = document.createElement("p");
      what.innerHTML = `<strong>What I built.</strong> ${project.what}`;
      textBlock.appendChild(what);
    }
    if (project.why) {
      const why = document.createElement("p");
      why.innerHTML = `<strong>Why it matters.</strong> ${project.why}`;
      textBlock.appendChild(why);
    }
    body.appendChild(textBlock);
  }

  if (project.subprojects && project.subprojects.length) {
    body.appendChild(createSectionTitle("Subprojects"));
    const subWrap = document.createElement("div");
    subWrap.className = "project-subprojects";
    project.subprojects.forEach((sub) => {
      const subCard = document.createElement("div");
      subCard.className = "project-subproject";
      const subHeading = document.createElement("h5");
      subHeading.textContent = sub.title;
      const subGoal = document.createElement("p");
      subGoal.innerHTML = `<strong>Goal:</strong> ${sub.goal}`;
      const subDid = document.createElement("p");
      subDid.innerHTML = `<strong>What I did:</strong> ${sub.did}`;
      const subTools = document.createElement("div");
      subTools.className = "project-tech";
      sub.tools.forEach((tool) => subTools.appendChild(createTag(tool)));
      subCard.append(subHeading, subGoal, subDid, subTools);
      subWrap.appendChild(subCard);
    });
    body.appendChild(subWrap);
  }

  if (project.highlights && project.highlights.length) {
    body.appendChild(createSectionTitle("Technical highlights"));
    const highlightsList = document.createElement("ul");
    highlightsList.className = "project-highlights";
    project.highlights.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      highlightsList.appendChild(li);
    });
    body.appendChild(highlightsList);
  }

  if (project.tech && project.tech.length) {
    body.appendChild(createSectionTitle("Tech"));
    const techRow = document.createElement("div");
    techRow.className = "project-tech";
    project.tech.forEach((tag) => techRow.appendChild(createTag(tag)));
    body.appendChild(techRow);
  }

  const links = [...(project.links || []), ...(project.reportLink ? [project.reportLink] : [])];
  if (links.length) {
    const linksRow = document.createElement("div");
    linksRow.className = "project-links";
    links.forEach((link) => linksRow.appendChild(createLink(link)));
    body.appendChild(linksRow);
  }

  return body;
}

function createWorkCard(project, index, options = {}) {
  const { href, interactiveModel = false } = options;
  const card = document.createElement(href ? "a" : "article");
  card.className = "work-card";
  card.style.setProperty("--i", index);
  if (href) {
    card.href = href;
  } else {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `Open project: ${project.title}`);
  }

  const media = document.createElement("div");
  media.className = "work-media";

  if (project.model && interactiveModel) {
    media.classList.add("project-model");
    media.dataset.model = project.model;
    media.dataset.fallback = project.cover;
    media.innerHTML = `
      <div class="model-loading">Loading 3D model…</div>
      <span class="model-badge">Interactive 3D · drag to orbit</span>
      <button type="button" class="model-reset">Reset view</button>
    `;
  } else {
    if (/ur5-push-place|hydrogel|bike-hmm/.test(project.cover)) media.classList.add("is-contain");
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    setImageSourceWithFallback(img, project.cover, {
      sizes: "(max-width: 760px) 92vw, 50vw",
    });
    media.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "work-body";
  body.innerHTML = `
    <div class="work-top"><span>${String(index + 1).padStart(2, "0")}</span><span>${project.category.slice(0, 2).join(" · ")}</span></div>
  `;
  const title = document.createElement("h3");
  title.textContent = project.title;
  const blurb = document.createElement("p");
  blurb.textContent = project.blurb;
  const more = document.createElement("span");
  more.className = "work-more";
  more.innerHTML = `View project <span class="arrow" aria-hidden="true">→</span>`;
  body.append(title, blurb, more);

  card.append(media, body);
  return card;
}

// --- Project detail sheet --------------------------------------------------

let sheetEl = null;
let sheetReturnFocus = null;

function ensureSheet() {
  if (sheetEl) return sheetEl;
  sheetEl = document.createElement("div");
  sheetEl.className = "sheet";
  sheetEl.innerHTML = `
    <div class="sheet-backdrop" data-close></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <button type="button" class="sheet-close" data-close aria-label="Close project">✕</button>
      <div class="sheet-content"></div>
    </div>
  `;
  document.body.appendChild(sheetEl);
  sheetEl.addEventListener("click", (event) => {
    if (event.target.closest("[data-close]")) closeProject();
  });
  sheetEl.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProject();
    if (event.key === "Tab") {
      const focusables = sheetEl.querySelectorAll(
        'button, a[href], iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  return sheetEl;
}

function openProject(project, { updateHash = true } = {}) {
  const sheet = ensureSheet();
  sheetReturnFocus = document.activeElement;
  const content = sheet.querySelector(".sheet-content");
  content.innerHTML = "";

  const head = document.createElement("header");
  head.className = "sheet-head";
  const tags = document.createElement("div");
  tags.className = "project-tags";
  project.category.forEach((tag) => tags.appendChild(createTag(tag)));
  const heading = document.createElement("h2");
  heading.id = "sheet-title";
  heading.textContent = project.title;
  head.append(tags, heading);
  if (project.subtitle) {
    const sub = document.createElement("p");
    sub.className = "sheet-sub";
    sub.textContent = project.subtitle;
    head.appendChild(sub);
  }
  if (project.metaLine) {
    const meta = document.createElement("p");
    meta.className = "project-meta-line";
    meta.style.marginTop = "14px";
    meta.textContent = project.metaLine;
    head.appendChild(meta);
  }

  const body = document.createElement("div");
  body.className = "sheet-body";
  body.appendChild(buildProjectDetail(project));
  content.append(head, body);

  const panel = sheet.querySelector(".sheet-panel");
  panel.scrollTop = 0;
  document.documentElement.style.overflow = "hidden";
  sheet.classList.add("open");
  requestAnimationFrame(() => panel.focus({ preventScroll: true }));

  if (updateHash && location.hash !== `#${project.id}`) {
    history.pushState(null, "", `#${project.id}`);
  }
}

function closeProject({ fromHistory = false } = {}) {
  if (!sheetEl || !sheetEl.classList.contains("open")) return;
  sheetEl.classList.remove("open");
  document.documentElement.style.overflow = "";
  // Stop any playing embeds.
  setTimeout(() => {
    if (!sheetEl.classList.contains("open")) sheetEl.querySelector(".sheet-content").innerHTML = "";
  }, 500);
  if (!fromHistory && location.hash) {
    history.pushState(null, "", location.pathname + location.search);
  }
  if (sheetReturnFocus && sheetReturnFocus.focus) sheetReturnFocus.focus({ preventScroll: true });
}

function syncProjectFromHash() {
  if (!document.getElementById("projects-list")) return;
  const id = decodeURIComponent(location.hash.slice(1));
  const project = PROJECTS.find((item) => item.id === id);
  if (project) {
    openProject(project, { updateHash: false });
  } else {
    closeProject({ fromHistory: true });
  }
}

// --- Projects page -----------------------------------------------------------

function renderProjects(filter = "All") {
  const list = document.getElementById("projects-list");
  if (!list) return;
  list.innerHTML = "";

  const filtered =
    filter === "All"
      ? PROJECTS
      : PROJECTS.filter((project) => project.category.includes(filter));

  filtered.forEach((project, index) => {
    const card = createWorkCard(project, index, { interactiveModel: true });
    const open = (event) => {
      if (event.target.closest(".project-model canvas, .model-reset")) return;
      openProject(project);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && event.target === card) {
        event.preventDefault();
        openProject(project);
      }
    });
    list.appendChild(card);
  });
  initModelViewers();
}

function setupFilters() {
  const filtersEl = document.querySelector(".project-filters");
  if (!filtersEl) return;
  filtersEl.innerHTML = "";
  let active = "All";

  PROJECT_FILTERS.forEach((label) => {
    const count =
      label === "All" ? PROJECTS.length : PROJECTS.filter((project) => project.category.includes(label)).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-chip";
    btn.dataset.filter = label;
    btn.innerHTML = `${label}<span class="count">${count}</span>`;
    btn.setAttribute("aria-pressed", label === active ? "true" : "false");
    if (label === active) btn.classList.add("active");

    btn.addEventListener("click", () => {
      active = label;
      filtersEl.querySelectorAll(".filter-chip").forEach((chip) => {
        const isActive = chip.dataset.filter === active;
        chip.classList.toggle("active", isActive);
        chip.setAttribute("aria-pressed", String(isActive));
      });
      renderProjects(active);
    });
    filtersEl.appendChild(btn);
  });
}

// --- Home ------------------------------------------------------------------

function renderFeatured() {
  const root = document.getElementById("featured-work");
  if (!root) return;
  FEATURED_PROJECT_IDS.map((id) => PROJECTS.find((project) => project.id === id))
    .filter(Boolean)
    .forEach((project, index) => {
      const card = createWorkCard(project, index, { href: `projects.html#${project.id}` });
      card.setAttribute("data-reveal", "");
      card.style.setProperty("--d", `${(index % 2) * 0.1}s`);
      root.appendChild(card);
    });
}

function renderFilm() {
  const track = document.getElementById("film-track");
  if (!track) return;
  // Two copies so the loop is seamless.
  [...HOME_FILM, ...HOME_FILM].forEach((src, index) => {
    const item = document.createElement("div");
    item.className = "film-item";
    const img = document.createElement("img");
    img.alt = index < HOME_FILM.length ? "Photo from the gallery" : "";
    img.loading = "lazy";
    img.height = 360;
    setImageSourceWithFallback(img, src, { sizes: "360px", onHardFailure: () => item.remove() });
    item.appendChild(img);
    if (index >= HOME_FILM.length) item.setAttribute("aria-hidden", "true");
    track.appendChild(item);
  });
}

function initStats() {
  const sources = {
    projects: PROJECTS.length,
    courses: coursesData.reduce((total, section) => total + section.courses.length, 0),
  };
  const nums = document.querySelectorAll("[data-count], [data-count-source]");
  nums.forEach((el) => {
    const target = Number(sources[el.dataset.countSource] ?? el.dataset.count);
    if (!Number.isFinite(target)) return;
    el.dataset.target = target;
    el.textContent = target;
  });
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const el = entry.target;
        const target = Number(el.dataset.target);
        const startTime = performance.now();
        const duration = 1400;
        const tick = (now) => {
          const p = Math.min(1, (now - startTime) / duration);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = "0";
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 },
  );
  nums.forEach((el) => observer.observe(el));
}

function initWordReveal() {
  const blocks = document.querySelectorAll("[data-words]");
  if (!blocks.length) return;
  const items = [];
  blocks.forEach((block) => {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const span = document.createElement("span");
              span.className = "w";
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(block);
    items.push({ block, words: [...block.querySelectorAll(".w")] });
  });

  if (prefersReducedMotion()) {
    items.forEach(({ words }) => words.forEach((word) => word.classList.add("on")));
    return;
  }

  const update = () => {
    const vh = window.innerHeight;
    items.forEach(({ block, words }) => {
      const rect = block.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - rect.top) / (vh * 0.5)));
      const lit = Math.round(progress * words.length);
      words.forEach((word, index) => word.classList.toggle("on", index < lit));
    });
  };
  onScrollFrame(update);
}

function initParallax() {
  const frames = document.querySelectorAll("[data-parallax]");
  const path = document.querySelector("[data-path]");
  if (prefersReducedMotion()) return;
  if (!frames.length && !path) return;
  const update = () => {
    const vh = window.innerHeight;
    frames.forEach((frame) => {
      const rect = frame.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      const offset = Math.max(-1, Math.min(1, center / vh)) * -0.5 + 0.5;
      frame.style.setProperty("--py", (offset * rect.height * 0.1).toFixed(1));
    });
    if (path) {
      const rect = path.getBoundingClientRect();
      const vertical = window.innerWidth <= 860;
      const progress = vertical
        ? (vh * 0.75 - rect.top) / rect.height
        : (vh * 0.9 - rect.top) / (vh * 0.45);
      const p = Math.min(1, Math.max(0, progress));
      path.style.setProperty("--p", p.toFixed(3));
      const steps = path.querySelectorAll("li");
      steps.forEach((step, index) => {
        step.classList.toggle("is-lit", p >= (index / Math.max(1, steps.length - 1)) * 0.98);
      });
    }
  };
  onScrollFrame(update);
}

function onScrollFrame(fn) {
  let queued = false;
  const run = () => {
    queued = false;
    fn();
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(run);
    }
  };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  fn();
}

function initSpotlight() {
  document.querySelectorAll(".focus-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = "Copied ✓";
        button.classList.add("copied");
      } catch (err) {
        window.location.href = `mailto:${button.dataset.copy}`;
        return;
      }
      setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("copied");
      }, 1800);
    });
  });
}

function initHeroEntrance() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const hint = hero.querySelector(".hint-text");
  if (hint && window.matchMedia("(pointer: coarse)").matches) hint.textContent = "Tap the pins";
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-entered")));
}

// --- Shared ----------------------------------------------------------------

function setupRevealAnimations() {
  const items = document.querySelectorAll("[data-reveal]:not(.is-in)");
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  items.forEach((item) => observer.observe(item));
}

let lightboxEl = null;
let lightboxState = { sources: [], index: 0, label: "" };

function showLightboxImage() {
  const { sources, index, label } = lightboxState;
  const img = lightboxEl.querySelector("img");
  const src = sources[index];
  const entry = typeof src === "object" ? src : { src, alt: label || "Photo" };
  img.alt = entry.alt || "Photo";
  setImageSourceWithFallback(img, entry.src, { sizes: "100vw" });
  const many = sources.length > 1;
  lightboxEl.querySelector(".lightbox-prev").hidden = !many;
  lightboxEl.querySelector(".lightbox-next").hidden = !many;
  lightboxEl.querySelector(".lightbox-caption").textContent = many
    ? `${String(index + 1).padStart(2, "0")} / ${String(sources.length).padStart(2, "0")}${label ? ` · ${label}` : ""}`
    : label;
}

function stepLightbox(delta) {
  const count = lightboxState.sources.length;
  if (count < 2) return;
  lightboxState.index = (lightboxState.index + delta + count) % count;
  showLightboxImage();
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("open");
  if (!sheetEl || !sheetEl.classList.contains("open")) {
    document.documentElement.style.overflow = "";
  }
}

function openLightbox(sources, index = 0, label = "") {
  const list = Array.isArray(sources) ? sources : [sources];
  if (!list.length || !list[index]) return;
  if (!lightboxEl) {
    lightboxEl = document.createElement("div");
    lightboxEl.className = "lightbox";
    lightboxEl.setAttribute("role", "dialog");
    lightboxEl.setAttribute("aria-modal", "true");
    lightboxEl.setAttribute("aria-label", "Image viewer");
    lightboxEl.innerHTML = `
      <img alt="" />
      <button type="button" class="lightbox-btn lightbox-close" aria-label="Close image">✕</button>
      <button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous image">←</button>
      <button type="button" class="lightbox-btn lightbox-next" aria-label="Next image">→</button>
      <div class="lightbox-caption" aria-live="polite"></div>
    `;
    document.body.appendChild(lightboxEl);
    lightboxEl.addEventListener("click", (event) => {
      if (event.target.closest(".lightbox-prev")) return stepLightbox(-1);
      if (event.target.closest(".lightbox-next")) return stepLightbox(1);
      if (event.target === lightboxEl || event.target.closest(".lightbox-close")) closeLightbox();
    });
    lightboxEl.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeLightbox();
      }
      if (event.key === "ArrowLeft") stepLightbox(-1);
      if (event.key === "ArrowRight") stepLightbox(1);
    });
    let touchX = null;
    lightboxEl.addEventListener("touchstart", (event) => {
      touchX = event.touches[0].clientX;
    }, { passive: true });
    lightboxEl.addEventListener("touchend", (event) => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
      touchX = null;
    });
  }
  lightboxState = { sources: list, index, label };
  showLightboxImage();
  document.documentElement.style.overflow = "hidden";
  lightboxEl.classList.add("open");
  lightboxEl.querySelector(".lightbox-close").focus({ preventScroll: true });
}

const modelViewers = new Map();

function showModelFallback(container) {
  if (container.querySelector("img")) return;
  const fallback = container.dataset.fallback;
  if (!fallback) return;
  container.classList.remove("project-model");
  container.classList.add("is-contain");
  container.innerHTML = "";
  const img = document.createElement("img");
  img.alt = "";
  setImageSourceWithFallback(img, fallback, { sizes: "(max-width: 760px) 92vw, 50vw" });
  container.appendChild(img);
}

function initModelViewers() {
  const containers = document.querySelectorAll(".project-model");
  if (!containers.length) return;
  if (!window.THREE || !window.THREE.GLTFLoader || !window.THREE.OrbitControls) {
    containers.forEach(showModelFallback);
    return;
  }
  // Only build a viewer (and fetch the 7 MB model) once its card is near the viewport.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        createModelViewer(entry.target);
      });
    },
    { rootMargin: "200px" },
  );
  containers.forEach((container) => {
    if (!modelViewers.has(container)) observer.observe(container);
  });
}

function createModelViewer(container) {
  if (modelViewers.has(container) || !container.isConnected) return;
  const THREE = window.THREE;
  const modelUrl = container.dataset.model;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    showModelFallback(container);
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(2, 2, 2);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.domElement.style.touchAction = "pan-y";
  container.prepend(renderer.domElement);
  ["pointerdown", "click"].forEach((type) =>
    renderer.domElement.addEventListener(type, (event) => event.stopPropagation()),
  );
  renderer.domElement.addEventListener("pointerdown", () => {
    renderer.domElement.style.cursor = "grabbing";
    controls.autoRotate = false;
  });
  ["pointerup", "pointerleave"].forEach((type) =>
    renderer.domElement.addEventListener(type, () => {
      renderer.domElement.style.cursor = "grab";
    }),
  );

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.autoRotate = !prefersReducedMotion();
  controls.autoRotateSpeed = 1.2;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9c4ba, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 2);
  scene.add(key);
  const warm = new THREE.DirectionalLight(0xff8a5c, 1.1);
  warm.position.set(-3, 1.5, -2);
  scene.add(warm);

  const loader = new THREE.GLTFLoader();
  const initialTarget = new THREE.Vector3();
  const initialPos = new THREE.Vector3();

  loader.load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      controls.target.copy(center);
      camera.near = size / 100;
      camera.far = size * 10;
      camera.updateProjectionMatrix();
      camera.position.copy(center).add(new THREE.Vector3(size * 0.85, size * 0.45, size * 0.85));
      controls.update();
      initialTarget.copy(controls.target);
      initialPos.copy(camera.position);
      const loading = container.querySelector(".model-loading");
      if (loading) loading.remove();
    },
    undefined,
    () => {
      const loading = container.querySelector(".model-loading");
      if (loading) loading.textContent = "Model failed to load";
    },
  );

  const resetButton = container.querySelector(".model-reset");
  if (resetButton) {
    resetButton.addEventListener("click", (event) => {
      event.stopPropagation();
      controls.target.copy(initialTarget);
      camera.position.copy(initialPos);
      controls.update();
    });
  }

  let visible = true;
  function animate() {
    if (!container.isConnected) {
      renderer.dispose();
      modelViewers.delete(container);
      return;
    }
    requestAnimationFrame(animate);
    if (!visible || document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(container);

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width && height) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    }
  });
  resizeObserver.observe(container);

  modelViewers.set(container, { renderer, scene, camera, controls, resizeObserver });
}

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const entries = GALLERY_IMAGES.map((entry) =>
    typeof entry === "string" ? { src: entry, alt: "Gallery photo" } : entry,
  );
  entries.forEach(({ src, alt }, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-item";
    button.style.setProperty("--i", Math.min(index, 16));
    button.setAttribute("aria-label", `Open photo: ${alt}`);
    const img = document.createElement("img");
    img.alt = alt;
    img.loading = index < 8 ? "eager" : "lazy";
    setImageSourceWithFallback(img, src, {
      sizes: "(max-width: 760px) 46vw, (max-width: 1100px) 31vw, 24vw",
      onHardFailure: () => button.remove(),
    });
    button.appendChild(img);
    button.addEventListener("click", () => openLightbox(entries, index));
    grid.appendChild(button);
  });
}

function initMobileNav() {
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const target = (link.getAttribute("href") || "").toLowerCase();
    if (target === current || (current === "" && target === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll(".nav").forEach((nav) => {
    const toggle = nav.querySelector(".nav-toggle");
    const links = nav.querySelector(".nav-links");
    if (!toggle || !links) return;
    nav.classList.add("nav-ready");

    const setOpen = (isOpen) => {
      nav.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    };

    setOpen(false);

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("nav-open");
      setOpen(!isOpen);
    });

    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) {
        setOpen(false);
      }
    });
  });
}

function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initYear();
  renderCourses();
  setupFilters();
  renderProjects();
  renderGallery();
  renderFeatured();
  renderFilm();
  initStats();
  initWordReveal();
  initParallax();
  initSpotlight();
  initCopyButtons();
  initHeroEntrance();
  setupRevealAnimations();
  syncProjectFromHash();
  window.addEventListener("popstate", syncProjectFromHash);
});
