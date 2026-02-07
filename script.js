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
    title: "MigraineWave: Personal macOS Pain Tracking App",
    blurb:
      "Built a privacy-first macOS app for tracking migraine and chronic pain episodes with low-friction logging and clear trend visualization.",
    cover: "assets/projects/migraine-app/SCR-20260206-sxeo.jpeg",
    media: [
      { type: "image", src: "assets/projects/migraine-app/SCR-20260206-sxeo.jpeg" },
      { type: "image", src: "assets/projects/migraine-app/SCR-20260206-sxhi.jpeg" },
      { type: "image", src: "assets/projects/migraine-app/SCR-20260206-sxjt.jpeg" },
      { type: "image", src: "assets/projects/migraine-app/SCR-20260206-syhn.jpeg" },
      { type: "youtube", id: "OzfOmHlkw-Y", title: "MigraineWave demo" },
    ],
    what:
      "A native macOS application that lets users quickly log pain intensity with automatic timestamps and optional context, then review symptom history through wave-based visualizations designed for fast pattern recognition.",
    why:
      "People with migraines often track symptoms in notes or spreadsheets, which makes trends harder to interpret. MigraineWave reduces logging friction and improves clarity while keeping sensitive health data local to the device.",
    highlights: [
      "Custom pain-severity dial with fine-grained increments and smooth snapping",
      "Fast, structured logging flow with optional medication, activity, and notes context",
      "Wave-style time-series charts that preserve zero-pain days for honest trend tracking",
      "Local-only persistence with no accounts, cloud sync, or third-party data services",
      "Release-ready macOS packaging pipeline for local distribution and testing",
    ],
    tech: [
      "Swift",
      "SwiftUI",
      "macOS",
      "Swift Package Manager",
      "Local persistence",
      "Data visualization",
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

function setImageSourceWithFallback(img, src, onHardFailure) {
  const optimizedSrc = getOptimizedImagePath(src);
  let fallbackAttempted = false;
  img.decoding = "async";
  img.onerror = () => {
    if (!fallbackAttempted && optimizedSrc !== src) {
      fallbackAttempted = true;
      img.src = src;
      return;
    }
    if (typeof onHardFailure === "function") {
      onHardFailure();
    }
  };
  img.src = optimizedSrc;
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

  const inner = document.createElement("div");
  inner.className = "course-card-inner";

  const front = document.createElement("div");
  front.className = "course-card-face course-card-front";
  front.innerHTML = `
    <h3 class="clamp-2">${course.name}</h3>
    <p class="course-instructor clamp-1">Instructor: ${course.instructor}</p>
    <div class="course-divider"></div>
    <div class="course-footer">
      <div class="course-tag">${schoolTag}</div>
      <div class="course-hint">Click to flip</div>
    </div>
  `;

  const back = document.createElement("div");
  back.className = "course-card-face course-card-back";
  back.innerHTML = `
    <h3 class="clamp-2">${course.name}</h3>
    <p class="course-school clamp-1">${course.school}</p>
    <div class="course-divider"></div>
    <p class="course-desc clamp-3">${course.description}</p>
    <div class="course-footer">
      <div class="course-hint">Click to flip back</div>
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

  coursesData.forEach((section) => {
    const wrapper = document.createElement("section");
    wrapper.className = "courses-category";

    const title = document.createElement("h2");
    title.textContent = section.category;
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

function createProjectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card reveal";

  const button = document.createElement("button");
  button.className = "project-toggle";
  const panelId = `project-panel-${project.id}`;
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", panelId);

  const header = document.createElement("div");
  header.className = "project-header";

  const cover = document.createElement("div");
  cover.className = "project-cover";

  if (project.model) {
    cover.classList.add("project-model");
    cover.dataset.model = project.model;
    cover.dataset.fallback = project.cover;
    cover.innerHTML = `
      <div class="model-loading">Loading 3D model...</div>
      <div class="model-reset">Reset view</div>
    `;
  } else {
    const coverImg = document.createElement("img");
    coverImg.alt = `${project.title} cover`;
    coverImg.loading = "lazy";
    setImageSourceWithFallback(coverImg, project.cover);
    cover.appendChild(coverImg);
  }

  const meta = document.createElement("div");
  meta.className = "project-meta";
  const title = document.createElement("h3");
  title.className = "clamp-2";
  title.textContent = project.title;
  meta.appendChild(title);

  if (project.subtitle) {
    const subtitle = document.createElement("div");
    subtitle.className = "project-subtitle clamp-1";
    subtitle.textContent = project.subtitle;
    meta.appendChild(subtitle);
  }

  const blurb = document.createElement("p");
  blurb.className = "project-blurb clamp-3";
  blurb.textContent = project.blurb;
  meta.appendChild(blurb);

  const tagsRow = document.createElement("div");
  tagsRow.className = "project-tags";
  project.category.slice(0, 6).forEach((tag) => tagsRow.appendChild(createTag(tag)));
  meta.appendChild(tagsRow);

  const hint = document.createElement("div");
  hint.className = "project-hint";
  hint.textContent = "Click to expand";
  meta.appendChild(hint);

  header.appendChild(cover);
  header.appendChild(meta);
  button.appendChild(header);

  const panel = document.createElement("div");
  panel.className = "project-panel";
  panel.id = panelId;
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-hidden", "true");

  const panelInner = document.createElement("div");
  panelInner.className = "project-panel-inner";

  if (project.metaLine || project.authorsLine) {
    const hero = document.createElement("div");
    hero.className = "project-hero";
    const heroTitle = document.createElement("div");
    const heroHeading = document.createElement("h4");
    heroHeading.textContent = project.title;
    heroTitle.appendChild(heroHeading);
    if (project.metaLine) {
      const metaLine = document.createElement("p");
      metaLine.className = "project-meta-line";
      metaLine.textContent = project.metaLine;
      heroTitle.appendChild(metaLine);
    }
    if (project.authorsLine) {
      const authorsLine = document.createElement("p");
      authorsLine.className = "project-meta-line";
      authorsLine.textContent = project.authorsLine;
      heroTitle.appendChild(authorsLine);
    }
    hero.appendChild(heroTitle);
    panelInner.appendChild(hero);
  }

  if (project.media && project.media.length) {
    const gallery = document.createElement("div");
    gallery.className = "project-gallery";
    project.media.forEach((item) => {
      const mediaItem = document.createElement("div");
      mediaItem.className = "project-gallery-item";
      if (item.type === "video") {
        const video = document.createElement("video");
        video.src = item.src;
        video.controls = true;
        video.playsInline = true;
        video.addEventListener("loadedmetadata", updateOpenPanels);
        mediaItem.appendChild(video);
      } else if (item.type === "youtube") {
        const iframe = document.createElement("iframe");
        const videoId = item.id || "";
        iframe.src = videoId ? `https://www.youtube.com/embed/${videoId}` : item.src;
        iframe.title = item.title || `${project.title} video`;
        iframe.loading = "lazy";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        iframe.addEventListener("load", updateOpenPanels);
        mediaItem.appendChild(iframe);
      } else {
        const img = document.createElement("img");
        img.alt = `${project.title} media`;
        img.loading = "lazy";
        setImageSourceWithFallback(img, item.src);
        img.addEventListener("load", updateOpenPanels);
        img.addEventListener("click", () => openLightbox(item.src));
        mediaItem.appendChild(img);
      }
      gallery.appendChild(mediaItem);
    });
    panelInner.appendChild(gallery);
  }

  if (project.overviewParagraph) {
    const overview = document.createElement("div");
    overview.className = "project-section";
    const title = document.createElement("h4");
    title.className = "project-section-title";
    title.textContent = "Overview";
    const paragraph = document.createElement("p");
    paragraph.textContent = project.overviewParagraph;
    overview.appendChild(title);
    overview.appendChild(paragraph);
    panelInner.appendChild(overview);
  }

  if (project.irParagraph) {
    const ir = document.createElement("div");
    ir.className = "project-section";
    const title = document.createElement("h4");
    title.className = "project-section-title";
    title.textContent = "IR testing setup";
    const paragraph = document.createElement("p");
    paragraph.textContent = project.irParagraph;
    ir.appendChild(title);
    ir.appendChild(paragraph);
    panelInner.appendChild(ir);
  }

  if (project.builtBullets) {
    const built = document.createElement("div");
    built.className = "project-section";
    const title = document.createElement("h4");
    title.className = "project-section-title";
    title.textContent = "What we built";
    const list = document.createElement("ul");
    project.builtBullets.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    built.appendChild(title);
    built.appendChild(list);
    panelInner.appendChild(built);
  }

  if (project.resultsBullets) {
    const results = document.createElement("div");
    results.className = "project-section";
    const title = document.createElement("h4");
    title.className = "project-section-title";
    title.textContent = "Key validation + results";
    const list = document.createElement("ul");
    project.resultsBullets.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    results.appendChild(title);
    results.appendChild(list);
    panelInner.appendChild(results);
  }

  if (project.what || project.why) {
    const textBlock = document.createElement("div");
    textBlock.className = "project-text";
    if (project.what) {
      const what = document.createElement("p");
      what.innerHTML = `<strong>What I built:</strong> ${project.what}`;
      textBlock.appendChild(what);
    }
    if (project.why) {
      const why = document.createElement("p");
      why.innerHTML = `<strong>Why it matters:</strong> ${project.why}`;
      textBlock.appendChild(why);
    }
    panelInner.appendChild(textBlock);
  }

  if (project.subprojects && project.subprojects.length) {
    const subTitle = document.createElement("h4");
    subTitle.className = "project-section-title";
    subTitle.textContent = "Subprojects";
    panelInner.appendChild(subTitle);

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
      subCard.appendChild(subHeading);
      subCard.appendChild(subGoal);
      subCard.appendChild(subDid);
      subCard.appendChild(subTools);
      subWrap.appendChild(subCard);
    });
    panelInner.appendChild(subWrap);
  }

  if (project.highlights && project.highlights.length) {
    const highlightsTitle = document.createElement("h4");
    highlightsTitle.className = "project-section-title";
    highlightsTitle.textContent = "Technical highlights";
    const highlightsList = document.createElement("ul");
    highlightsList.className = "project-highlights";
    project.highlights.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      highlightsList.appendChild(li);
    });
    panelInner.appendChild(highlightsTitle);
    panelInner.appendChild(highlightsList);
  }

  if (project.tech && project.tech.length) {
    const techTitle = document.createElement("h4");
    techTitle.className = "project-section-title";
    techTitle.textContent = "Tech";
    const techRow = document.createElement("div");
    techRow.className = "project-tech";
    project.tech.forEach((tag) => techRow.appendChild(createTag(tag)));
    panelInner.appendChild(techTitle);
    panelInner.appendChild(techRow);
  }

  if (project.links && project.links.length) {
    const linksRow = document.createElement("div");
    linksRow.className = "project-links";
    project.links.forEach((link) => linksRow.appendChild(createLink(link)));
    panelInner.appendChild(linksRow);
  }
  if (project.reportLink) {
    const linksRow = document.createElement("div");
    linksRow.className = "project-links";
    linksRow.appendChild(createLink(project.reportLink));
    panelInner.appendChild(linksRow);
  }

  panel.appendChild(panelInner);
  card.appendChild(button);
  card.appendChild(panel);

  function togglePanel() {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    panel.setAttribute("aria-hidden", String(isExpanded));
    if (isExpanded) {
      panel.style.maxHeight = "0px";
      panel.classList.remove("open");
    } else {
      panel.classList.add("open");
      panel.style.maxHeight = panel.scrollHeight + "px";
      if (project.model) {
        initModelViewers();
      }
    }
  }

  button.addEventListener("click", (event) => {
    if (event.target.closest(".project-model") || event.target.closest(".model-reset")) {
      return;
    }
    togglePanel();
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePanel();
    }
  });

  return card;
}

function renderProjects(filter = "All") {
  const list = document.getElementById("projects-list");
  if (!list) return;
  list.innerHTML = "";

  const filtered =
    filter === "All"
      ? PROJECTS
      : PROJECTS.filter((project) => project.category.includes(filter));

  filtered.forEach((project) => list.appendChild(createProjectCard(project)));
  setupRevealAnimations();
  initModelViewers();
}

function setupFilters() {
  const filtersEl = document.querySelector(".project-filters");
  if (!filtersEl) return;
  filtersEl.innerHTML = "";
  let active = "All";

  PROJECT_FILTERS.forEach((label) => {
    const btn = document.createElement("button");
    btn.className = "filter-chip";
    btn.textContent = label;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", label === active ? "true" : "false");
    if (label === active) btn.classList.add("active");

    btn.addEventListener("click", () => {
      active = label;
      filtersEl.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", chip.textContent === active);
        chip.setAttribute("aria-selected", chip.textContent === active ? "true" : "false");
      });
      renderProjects(active);
    });
    filtersEl.appendChild(btn);
  });
}

function setupRevealAnimations() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = document.querySelectorAll(".project-card.reveal");
  if (prefersReducedMotion) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  cards.forEach((card) => observer.observe(card));
}

function updateOpenPanels() {
  document.querySelectorAll(".project-panel.open").forEach((panel) => {
    panel.style.maxHeight = panel.scrollHeight + "px";
  });
}

window.addEventListener("resize", updateOpenPanels);

let lightboxEl = null;
function openLightbox(src) {
  if (!src) return;
  if (!lightboxEl) {
    lightboxEl = document.createElement("div");
    lightboxEl.className = "lightbox";
    lightboxEl.innerHTML = `
      <button type="button" aria-label="Close image">Close</button>
      <img alt="Project image preview" />
    `;
    document.body.appendChild(lightboxEl);
    lightboxEl.addEventListener("click", (event) => {
      if (event.target === lightboxEl || event.target.tagName === "BUTTON") {
        lightboxEl.classList.remove("open");
      }
    });
  }
  const img = lightboxEl.querySelector("img");
  setImageSourceWithFallback(img, src);
  lightboxEl.classList.add("open");
}

const modelViewers = new Map();

function initModelViewers() {
  if (!window.THREE || !window.THREE.GLTFLoader || !window.THREE.OrbitControls) {
    document.querySelectorAll(".project-model").forEach((container) => {
      if (container.querySelector("img")) return;
      const fallback = container.dataset.fallback;
      if (fallback) {
        container.innerHTML = "";
        const img = document.createElement("img");
        img.alt = "Project cover";
        setImageSourceWithFallback(img, fallback);
        container.appendChild(img);
      }
    });
    return;
  }
  document.querySelectorAll(".project-model").forEach((container) => {
    if (modelViewers.has(container)) return;
    const modelUrl = container.dataset.model;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f7ff);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2, 2, 2);

    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    container.appendChild(renderer.domElement);
    renderer.domElement.addEventListener("pointerdown", (event) => event.stopPropagation());
    renderer.domElement.addEventListener("click", (event) => event.stopPropagation());
    renderer.domElement.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
    renderer.domElement.addEventListener("pointerdown", () => {
      renderer.domElement.style.cursor = "grabbing";
    });
    renderer.domElement.addEventListener("pointerup", () => {
      renderer.domElement.style.cursor = "grab";
    });
    renderer.domElement.addEventListener("pointerleave", () => {
      renderer.domElement.style.cursor = "grab";
    });

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.enableZoom = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(2, 2, 2);
    scene.add(dir);

    const loader = new THREE.GLTFLoader();
    let initialTarget = new THREE.Vector3();
    let initialPos = new THREE.Vector3();

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
        camera.position.copy(center).add(new THREE.Vector3(size / 2, size / 3, size / 2));
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

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

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
  });
}

function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  grid.innerHTML = "";
  GALLERY_IMAGES.forEach((src) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-item";
    const img = document.createElement("img");
    img.alt = "Gallery photo";
    img.loading = "lazy";
    setImageSourceWithFallback(img, src, () => button.remove());
    button.appendChild(img);
    button.addEventListener("click", () => openLightbox(src));
    grid.appendChild(button);
  });
}

function initMobileNav() {
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

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        setOpen(false);
      }
    });
  });
}

function initIntro() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  // Respect user motion preferences and skip on small screens.
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    try {
      localStorage.setItem("introSeen", "true");
    } catch (err) {
      // ignore
    }
    return;
  }
  if (window.innerWidth < 640) return;
  try {
    // Only run once per user.
    if (localStorage.getItem("introSeen") === "true") return;
  } catch (err) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "intro-overlay";
  overlay.innerHTML = `
    <button class="intro-skip" type="button">Skip intro →</button>
    <div class="intro-shell">
      <button class="intro-door-button" type="button" aria-label="Knock to enter">
        <div class="intro-door">
          <div class="door-panel door-left"></div>
          <div class="door-panel door-right"></div>
          <div class="door-cracks"></div>
          <div class="door-glow"></div>
        </div>
      </button>
      <div class="intro-caption">Knock to enter</div>
    </div>
  `;
  const reveal = document.createElement("div");
  reveal.className = "intro-reveal";
  reveal.setAttribute("aria-hidden", "true");
  reveal.innerHTML = `<div class="intro-welcome">Welcome</div>`;
  overlay.insertBefore(reveal, overlay.querySelector(".intro-shell"));
  document.body.appendChild(overlay);
  document.body.classList.add("intro-active");

  const doorBtn = overlay.querySelector(".intro-door-button");
  const skipBtn = overlay.querySelector(".intro-skip");
  let opening = false;
  const timeouts = [];

  const finish = () => {
    // Clean up: stop timers, mark as seen, remove overlay.
    timeouts.forEach((id) => clearTimeout(id));
    try {
      localStorage.setItem("introSeen", "true");
    } catch (err) {
      // ignore
    }
    overlay.classList.add("fade-out");
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("intro-active");
    }, 600);
  };

  const start = () => {
    if (opening) return;
    opening = true;
    overlay.classList.add("knock");
    timeouts.push(setTimeout(() => {
      overlay.classList.remove("knock");
      overlay.classList.add("cracked");
    }, 280));
    timeouts.push(setTimeout(() => {
      overlay.classList.add("opening");
    }, 820));
    timeouts.push(setTimeout(() => {
      finish();
    }, 2200));
  };

  doorBtn.addEventListener("click", start);
  doorBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      start();
    }
  });

  skipBtn.addEventListener("click", finish);
  overlay.addEventListener("click", () => {
    if (opening && overlay.classList.contains("opening")) {
      finish();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      finish();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  renderCourses();
  setupFilters();
  renderProjects();
  renderGallery();
  initIntro();
});
