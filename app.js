// Railway Traffic Simulation Application
class RailwaySimulator {
  constructor() {
    this.isRunning = false;
    this.simulationSpeed = 1;
    this.simulationTime = 0;
    this.trains = [];
    this.tracks = {
      A: {
        name: "Track A",
        capacity: 5,
        color: "#3498db",
        occupancy: 0,
        trains: [],
      },
      B: {
        name: "Track B",
        capacity: 5,
        color: "#2ecc71",
        occupancy: 0,
        trains: [],
      },
      C: {
        name: "Track C",
        capacity: 4,
        color: "#e74c3c",
        occupancy: 0,
        trains: [],
      },
    };
    this.metrics = {
      throughput: 0,
      averageDelay: 0,
      efficiency: 100,
      conflictsResolved: 0,
      trainsCompleted: 0,
    };
    this.aiDecisions = [];
    this.charts = {};
    this.chartData = {
      throughput: [],
      utilization: { A: [], B: [], C: [] },
      timeLabels: [],
    };
    this.simulationLoop = null;
    this.aiDecisionInterval = null;

    this.init();
  }

  init() {
    console.log("Initializing NEXUS Rail AI System...");
    this.setupEventListeners();
    this.loadInitialData();
    this.initializeCharts();
    this.updateDisplay();
    this.startAIEngine();
    console.log("NEXUS Rail AI initialized successfully");
  }

  loadInitialData() {
    // Initial train data from the provided JSON
    const initialTrains = [
      {
        id: "T001",
        type: "Express",
        speed: 120,
        priority: "High",
        position: 0,
        track: "A",
        destination: 1000,
        status: "moving",
      },
      {
        id: "T002",
        type: "Passenger",
        speed: 80,
        priority: "Medium",
        position: 100,
        track: "B",
        destination: 500,
        status: "moving",
      },
      {
        id: "T003",
        type: "Freight",
        speed: 60,
        priority: "Low",
        position: 200,
        track: "C",
        destination: 1000,
        status: "moving",
      },
      {
        id: "T004",
        type: "Passenger",
        speed: 90,
        priority: "Medium",
        position: 0,
        track: "B",
        destination: 1000,
        status: "moving",
      },
      {
        id: "T005",
        type: "Express",
        speed: 110,
        priority: "High",
        position: 300,
        track: "A",
        destination: 500,
        status: "moving",
      },
    ];

    initialTrains.forEach((train) => {
      this.addTrain(train);
    });

    console.log(`Loaded ${initialTrains.length} initial trains`);
  }

  setupEventListeners() {
    // Control buttons
    const startBtn = document.getElementById("start-simulation");
    const pauseBtn = document.getElementById("pause-simulation");
    const emergencyBtn = document.getElementById("emergency-stop");
    const resetBtn = document.getElementById("reset-simulation");
    const addTrainBtn = document.getElementById("add-train");

    if (startBtn)
      startBtn.addEventListener("click", () => this.startSimulation());
    if (pauseBtn)
      pauseBtn.addEventListener("click", () => this.pauseSimulation());
    if (emergencyBtn)
      emergencyBtn.addEventListener("click", () => this.emergencyStop());
    if (resetBtn)
      resetBtn.addEventListener("click", () => this.resetSimulation());
    if (addTrainBtn)
      addTrainBtn.addEventListener("click", () => this.showAddTrainModal());

    // Simulation controls
    const speedSelect = document.getElementById("simulation-speed");
    const scenarioSelect = document.getElementById("scenario-select");

    if (speedSelect) {
      speedSelect.addEventListener("change", (e) => {
        this.simulationSpeed = parseInt(e.target.value);
        console.log(`Simulation speed changed to ${this.simulationSpeed}x`);
      });
    }

    if (scenarioSelect) {
      scenarioSelect.addEventListener("change", (e) => {
        this.loadScenario(e.target.value);
      });
    }

    // Modal controls
    const closeModalBtn = document.getElementById("close-modal");
    const closeAddTrainModalBtn = document.getElementById(
      "close-add-train-modal"
    );
    const addTrainForm = document.getElementById("add-train-form");

    if (closeModalBtn)
      closeModalBtn.addEventListener("click", () => this.hideTrainModal());
    if (closeAddTrainModalBtn)
      closeAddTrainModalBtn.addEventListener("click", () =>
        this.hideAddTrainModal()
      );
    if (addTrainForm)
      addTrainForm.addEventListener("submit", (e) => this.handleAddTrain(e));

    // Click outside modal to close
    const trainModal = document.getElementById("train-modal");
    const addTrainModal = document.getElementById("add-train-modal");

    if (trainModal) {
      trainModal.addEventListener("click", (e) => {
        if (e.target.id === "train-modal") this.hideTrainModal();
      });
    }

    if (addTrainModal) {
      addTrainModal.addEventListener("click", (e) => {
        if (e.target.id === "add-train-modal") this.hideAddTrainModal();
      });
    }

    console.log("Event listeners setup complete");
  }

  // Track highlighting functionality
  highlightTrack(trackId, highlightType = "decision") {
    const trackElement = document.getElementById(`track-${trackId}`);
    if (trackElement) {
      // Remove any existing highlight classes
      trackElement.classList.remove(
        "highlight-decision",
        "highlight-conflict",
        "highlight-optimization"
      );

      // Add the appropriate highlight class
      trackElement.classList.add(`highlight-${highlightType}`);

      // Remove the highlight after animation completes
      setTimeout(() => {
        trackElement.classList.remove(`highlight-${highlightType}`);
      }, 3000);

      console.log(`Highlighting Track ${trackId} for ${highlightType}`);
    }
  }

  addTrain(trainData) {
    const train = {
      ...trainData,
      startTime: this.simulationTime,
      delay: 0,
      element: null,
      originalSpeed: trainData.speed,
    };

    this.trains.push(train);
    this.tracks[train.track].trains.push(train);
    this.tracks[train.track].occupancy++;

    this.createTrainElement(train);
    this.updateTrackCapacity(train.track);
    console.log(`Added train ${train.id} to track ${train.track}`);
  }

  createTrainElement(train) {
    const trackElement = document.querySelector(
      `[data-track="${train.track}"] .track-line`
    );
    if (!trackElement) {
      console.error(`Track element not found for track ${train.track}`);
      return;
    }

    const trainElement = document.createElement("div");

    trainElement.className = `train train--${train.type.toLowerCase()}`;
    trainElement.style.left = `${(train.position / 1000) * 100}%`;
    trainElement.textContent = train.id.slice(-1); // Show last digit
    trainElement.title = `${train.id} - ${train.type}`;
    trainElement.setAttribute("data-train-id", train.id);
    trainElement.style.position = "absolute";
    trainElement.style.cursor = "pointer";
    trainElement.style.transition = "left 0.5s linear";

    trainElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showTrainDetails(train);
      console.log(`Clicked on train ${train.id}`);
    });

    trackElement.appendChild(trainElement);
    train.element = trainElement;
  }

  startSimulation() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.simulationLoop = setInterval(() => this.update(), 200); // Update every 200ms for smoother animation

      const startBtn = document.getElementById("start-simulation");
      const pauseBtn = document.getElementById("pause-simulation");

      if (startBtn) {
        startBtn.textContent = "Running...";
        startBtn.disabled = true;
        startBtn.classList.add("btn--secondary");
        startBtn.classList.remove("btn--primary");
      }
      if (pauseBtn) {
        pauseBtn.disabled = false;
      }

      console.log("NEXUS Rail AI Simulation started");
      this.addAIDecision(
        "NEXUS Rail AI activated - monitoring all train movements"
      );

      // Start immediate AI demonstration
      setTimeout(() => {
        if (this.isRunning) {
          this.highlightTrack("A", "decision");
          this.addAIDecision(
            "Initial optimization scan on Track A - analyzing traffic patterns",
            "A"
          );
        }
      }, 2000);
    }
  }

  pauseSimulation() {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.simulationLoop) {
        clearInterval(this.simulationLoop);
        this.simulationLoop = null;
      }

      const startBtn = document.getElementById("start-simulation");
      const pauseBtn = document.getElementById("pause-simulation");

      if (startBtn) {
        startBtn.textContent = "Resume";
        startBtn.disabled = false;
        startBtn.classList.add("btn--primary");
        startBtn.classList.remove("btn--secondary");
      }
      if (pauseBtn) {
        pauseBtn.disabled = true;
      }

      console.log("Simulation paused");
      this.addAIDecision("Simulation paused - all train movements halted");
    }
  }

  emergencyStop() {
    this.isRunning = false;
    if (this.simulationLoop) {
      clearInterval(this.simulationLoop);
      this.simulationLoop = null;
    }

    this.trains.forEach((train) => {
      train.status = "stopped";
      if (train.element) {
        train.element.style.backgroundColor = "#e74c3c";
      }
    });

    const startBtn = document.getElementById("start-simulation");
    if (startBtn) {
      startBtn.textContent = "Start Simulation";
      startBtn.disabled = false;
      startBtn.classList.add("btn--primary");
      startBtn.classList.remove("btn--secondary");
    }

    console.log("Emergency stop activated");
    this.addAIDecision(
      "Emergency stop activated - all trains halted for safety"
    );

    // Highlight all tracks for emergency
    ["A", "B", "C"].forEach((trackId) => {
      this.highlightTrack(trackId, "conflict");
    });
  }

  resetSimulation() {
    this.pauseSimulation();
    this.simulationTime = 0;
    this.trains = [];
    this.metrics = {
      throughput: 0,
      averageDelay: 0,
      efficiency: 100,
      conflictsResolved: 0,
      trainsCompleted: 0,
    };

    // Clear track occupancy
    Object.keys(this.tracks).forEach((trackId) => {
      this.tracks[trackId].occupancy = 0;
      this.tracks[trackId].trains = [];
    });

    // Remove all train elements
    document.querySelectorAll(".train").forEach((el) => el.remove());

    // Clear charts
    this.chartData = {
      throughput: [],
      utilization: { A: [], B: [], C: [] },
      timeLabels: [],
    };

    this.loadInitialData();
    this.updateDisplay();
    if (this.charts.throughput) this.updateCharts();

    const startBtn = document.getElementById("start-simulation");
    if (startBtn) {
      startBtn.textContent = "Start Simulation";
      startBtn.disabled = false;
      startBtn.classList.add("btn--primary");
      startBtn.classList.remove("btn--secondary");
    }

    console.log("NEXUS Rail AI System reset");
    this.addAIDecision(
      "NEXUS Rail AI System reset - all trains and metrics cleared"
    );
  }

  update() {
    this.simulationTime += 0.2 * this.simulationSpeed; // Increment time

    // Update train positions
    this.trains.forEach((train) => this.updateTrain(train));

    // Check for conflicts and apply AI decisions
    this.checkConflicts();

    // Update metrics
    this.updateMetrics();

    // Update display
    this.updateDisplay();

    // Update charts every 10 seconds of simulation time
    if (Math.floor(this.simulationTime * 5) % 50 === 0) {
      this.recordChartData();
      if (this.charts.throughput) this.updateCharts();
    }
  }

  updateTrain(train) {
    if (train.status !== "moving") return;

    // Calculate movement based on speed (simplified movement)
    const speedFactor = (train.speed / 100) * this.simulationSpeed; // Adjusted for visible movement
    train.position += speedFactor;

    // Check if train reached destination
    if (train.position >= train.destination) {
      this.completeTrain(train);
      return;
    }

    // Update visual position with smooth animation
    if (train.element) {
      const newLeft = Math.min((train.position / 1000) * 100, 100);
      train.element.style.left = `${newLeft}%`;
    }
  }

  completeTrain(train) {
    train.status = "completed";
    train.position = train.destination;

    // Remove from track
    const trackIndex = this.tracks[train.track].trains.indexOf(train);
    if (trackIndex > -1) {
      this.tracks[train.track].trains.splice(trackIndex, 1);
      this.tracks[train.track].occupancy--;
    }

    // Remove visual element with fade out
    if (train.element) {
      train.element.style.opacity = "0";
      setTimeout(() => {
        if (train.element && train.element.parentNode) {
          train.element.remove();
        }
      }, 500);
    }

    // Remove from trains array
    const trainIndex = this.trains.indexOf(train);
    if (trainIndex > -1) {
      this.trains.splice(trainIndex, 1);
    }

    this.metrics.trainsCompleted++;
    this.updateTrackCapacity(train.track);

    console.log(`Train ${train.id} completed journey`);
    this.addAIDecision(
      `Train ${train.id} completed journey to station at position ${train.destination}`,
      train.track
    );
    this.highlightTrack(train.track, "optimization");

    // Add a new train to keep simulation going
    setTimeout(() => {
      this.addRandomTrain();
    }, 3000);
  }

  addRandomTrain() {
    if (!this.isRunning) return;

    const trainTypes = ["Express", "Passenger", "Freight"];
    const priorities = ["High", "Medium", "Low"];
    const destinations = [500, 1000];

    const assignedTrack = this.assignOptimalTrack();
    const randomType =
      trainTypes[Math.floor(Math.random() * trainTypes.length)];

    const trainData = {
      id: `T${String(Math.floor(Math.random() * 900) + 100)}`,
      type: randomType,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      destination:
        destinations[Math.floor(Math.random() * destinations.length)],
      position: 0,
      track: assignedTrack,
      status: "moving",
      speed: this.getOriginalSpeed(randomType),
    };

    this.addTrain(trainData);
    this.addAIDecision(
      `Auto-generated ${trainData.type} train ${trainData.id} assigned to Track ${assignedTrack}`,
      assignedTrack
    );
    this.highlightTrack(assignedTrack, "decision");
  }

  checkConflicts() {
    // Simple conflict detection: check if trains on same track are too close
    Object.keys(this.tracks).forEach((trackId) => {
      const trackTrains = this.tracks[trackId].trains.filter(
        (t) => t.status === "moving"
      );

      for (let i = 0; i < trackTrains.length - 1; i++) {
        for (let j = i + 1; j < trackTrains.length; j++) {
          const train1 = trackTrains[i];
          const train2 = trackTrains[j];

          const distance = Math.abs(train1.position - train2.position);
          const minDistance = 50; // Minimum safe distance

          if (distance < minDistance && train1.position < train2.position) {
            // Conflict detected - apply AI resolution
            this.resolveConflict(train1, train2, trackId);
          }
        }
      }
    });
  }

  resolveConflict(train1, train2, trackId) {
    // AI Decision: Adjust speed based on priority
    let decision = "";

    if (train1.priority === "High" && train2.priority !== "High") {
      train2.speed *= 0.8; // Slow down lower priority train
      decision = `Conflict resolved on Track ${trackId}: Reduced speed of ${train2.id} to give priority to ${train1.id}`;
    } else if (train2.priority === "High" && train1.priority !== "High") {
      train1.speed *= 0.8;
      decision = `Conflict resolved on Track ${trackId}: Reduced speed of ${train1.id} to give priority to ${train2.id}`;
    } else {
      // Same priority - slow down the following train
      const following = train1.position > train2.position ? train1 : train2;
      following.speed *= 0.9;
      decision = `Conflict resolved on Track ${trackId}: Reduced speed of following train ${following.id} to maintain safe distance`;
    }

    this.metrics.conflictsResolved++;
    this.addAIDecision(decision, trackId, "conflict");
    this.highlightTrack(trackId, "conflict");
  }

  startAIEngine() {
    // AI makes decisions every 8-12 seconds
    if (this.aiDecisionInterval) {
      clearInterval(this.aiDecisionInterval);
    }

    this.aiDecisionInterval = setInterval(() => {
      if (this.isRunning && this.trains.length > 0) {
        this.makeAIDecision();
      }
    }, 8000);
  }

  makeAIDecision() {
    const trackIds = ["A", "B", "C"];
    const randomTrack = trackIds[Math.floor(Math.random() * trackIds.length)];

    const decisions = [
      {
        text: `Optimizing track allocation for Track ${randomTrack} based on current traffic density`,
        track: randomTrack,
        type: "optimization",
      },
      {
        text: `Analyzing train priorities on Track ${randomTrack} to maximize throughput`,
        track: randomTrack,
        type: "optimization",
      },
      {
        text: `Adjusting signal timing for Track ${randomTrack} to reduce overall delay`,
        track: randomTrack,
        type: "decision",
      },
      {
        text: `Monitoring capacity utilization on Track ${randomTrack}`,
        track: randomTrack,
        type: "decision",
      },
      {
        text: `Implementing predictive scheduling for incoming trains on Track ${randomTrack}`,
        track: randomTrack,
        type: "optimization",
      },
      {
        text: `Balancing service requirements on Track ${randomTrack}`,
        track: randomTrack,
        type: "decision",
      },
    ];

    const randomDecision =
      decisions[Math.floor(Math.random() * decisions.length)];
    this.addAIDecision(
      randomDecision.text,
      randomDecision.track,
      randomDecision.type
    );
    this.highlightTrack(randomDecision.track, randomDecision.type);

    // Occasionally optimize speeds for tracks with trains
    if (Math.random() < 0.4) {
      this.optimizeTrainSpeeds();
    }
  }

  optimizeTrainSpeeds() {
    this.trains.forEach((train) => {
      if (train.status === "moving") {
        // AI optimization: adjust speed based on track utilization
        const utilization =
          this.tracks[train.track].occupancy /
          this.tracks[train.track].capacity;

        if (utilization > 0.8) {
          train.speed = Math.max(train.originalSpeed * 0.7, train.speed * 0.95);
          this.highlightTrack(train.track, "optimization");
        } else if (utilization < 0.4) {
          train.speed = Math.min(train.originalSpeed * 1.2, train.speed * 1.05);
          this.highlightTrack(train.track, "optimization");
        }
      }
    });
  }

  getOriginalSpeed(type) {
    switch (type) {
      case "Express":
        return 120;
      case "Passenger":
        return 85;
      case "Freight":
        return 60;
      default:
        return 80;
    }
  }

  addAIDecision(decision, trackId = null, decisionType = "decision") {
    const timestamp = this.formatTime(this.simulationTime);
    this.aiDecisions.unshift({
      time: timestamp,
      decision,
      track: trackId,
      type: decisionType,
    });

    // Keep only last 15 decisions
    if (this.aiDecisions.length > 15) {
      this.aiDecisions.pop();
    }

    // Update AI decision display
    const aiDisplay = document.getElementById("ai-decision-display");
    if (aiDisplay) {
      aiDisplay.innerHTML = `<p><strong>${timestamp}:</strong> ${decision}</p>`;
    }

    // Update decision log
    this.updateDecisionLog();
  }

  updateDecisionLog() {
    const logElement = document.getElementById("decision-log");
    if (logElement) {
      logElement.innerHTML = this.aiDecisions
        .slice(0, 8)
        .map(
          (decision) =>
            `<div class="decision-entry">
                    <div class="decision-time">${decision.time}${
              decision.track ? ` - Track ${decision.track}` : ""
            }</div>
                    <div class="decision-text">${decision.decision}</div>
                </div>`
        )
        .join("");
    }
  }

  updateMetrics() {
    // Calculate throughput (trains completed per hour)
    const hoursElapsed = this.simulationTime / 3600;
    this.metrics.throughput =
      hoursElapsed > 0
        ? Math.round(this.metrics.trainsCompleted / hoursElapsed)
        : 0;

    // Calculate average delay
    const activeTrains = this.trains.filter((t) => t.status === "moving");
    if (activeTrains.length > 0) {
      const totalDelay = activeTrains.reduce(
        (sum, train) => sum + train.delay,
        0
      );
      this.metrics.averageDelay = (totalDelay / activeTrains.length).toFixed(1);
    }

    // Calculate efficiency based on conflicts and delays
    const maxEfficiency = 100;
    const conflictPenalty = this.metrics.conflictsResolved * 1.5;
    const delayPenalty = parseFloat(this.metrics.averageDelay) * 0.3;
    this.metrics.efficiency = Math.max(
      75,
      Math.round(maxEfficiency - conflictPenalty - delayPenalty)
    );
  }

  updateDisplay() {
    // Update simulation time
    const timeElement = document.getElementById("simulation-time");
    if (timeElement) {
      timeElement.textContent = this.formatTime(this.simulationTime);
    }

    // Update metrics
    const throughputEl = document.getElementById("throughput-metric");
    const delayEl = document.getElementById("delay-metric");
    const efficiencyEl = document.getElementById("efficiency-metric");
    const conflictsEl = document.getElementById("conflicts-metric");

    if (throughputEl) throughputEl.textContent = this.metrics.throughput;
    if (delayEl) delayEl.textContent = this.metrics.averageDelay;
    if (efficiencyEl) efficiencyEl.textContent = this.metrics.efficiency;
    if (conflictsEl) conflictsEl.textContent = this.metrics.conflictsResolved;

    // Update track utilization
    Object.keys(this.tracks).forEach((trackId) => {
      const track = this.tracks[trackId];
      const utilizationPercent = Math.round(
        (track.occupancy / track.capacity) * 100
      );

      const utilEl = document.getElementById(
        `track-${trackId.toLowerCase()}-util`
      );
      const percentEl = document.getElementById(
        `track-${trackId.toLowerCase()}-percent`
      );

      if (utilEl) utilEl.style.width = `${utilizationPercent}%`;
      if (percentEl) percentEl.textContent = `${utilizationPercent}%`;

      this.updateTrackCapacity(trackId);
    });

    // Update active trains list
    this.updateTrainsList();
  }

  updateTrackCapacity(trackId) {
    const track = this.tracks[trackId];
    const trackElement = document.querySelector(`[data-track="${trackId}"]`);
    if (trackElement) {
      const occupancyElement = trackElement.querySelector(".current-occupancy");
      const fillElement = trackElement.querySelector(".capacity-fill");

      if (occupancyElement) occupancyElement.textContent = track.occupancy;
      if (fillElement) {
        const fillPercent = (track.occupancy / track.capacity) * 100;
        fillElement.style.width = `${fillPercent}%`;
      }
    }
  }

  updateTrainsList() {
    const listElement = document.getElementById("trains-list");
    if (listElement) {
      listElement.innerHTML = this.trains
        .map(
          (train) =>
            `<div class="train-item" data-train-id="${
              train.id
            }" style="cursor: pointer;">
                    <div class="train-info">
                        <div class="train-id">${train.id}</div>
                        <div class="train-type">${train.type}</div>
                    </div>
                    <div class="train-status status status--${
                      train.status === "moving" ? "success" : "info"
                    }">
                        ${train.status}
                    </div>
                </div>`
        )
        .join("");

      // Add click listeners to train items
      listElement.querySelectorAll(".train-item").forEach((item) => {
        item.addEventListener("click", () => {
          const trainId = item.getAttribute("data-train-id");
          const train = this.trains.find((t) => t.id === trainId);
          if (train) this.showTrainDetails(train);
        });
      });
    }
  }

  showTrainDetails(train) {
    const modal = document.getElementById("train-modal");
    const title = document.getElementById("modal-train-title");
    const details = document.getElementById("modal-train-details");

    if (!modal || !title || !details) {
      console.error("Modal elements not found");
      return;
    }

    title.textContent = `${train.id} - ${train.type} Train`;
    details.innerHTML = `
            <div class="form-group">
                <label class="form-label">Current Position</label>
                <div>${Math.round(train.position)} / ${
      train.destination
    } units</div>
            </div>
            <div class="form-group">
                <label class="form-label">Speed</label>
                <div>${train.speed.toFixed(1)} km/h</div>
            </div>
            <div class="form-group">
                <label class="form-label">Priority</label>
                <div class="status status--${
                  train.priority === "High"
                    ? "error"
                    : train.priority === "Medium"
                    ? "warning"
                    : "info"
                }">${train.priority}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Track Assignment</label>
                <div>Track ${train.track}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Status</label>
                <div class="status status--${
                  train.status === "moving" ? "success" : "info"
                }">${train.status}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Progress</label>
                <div>${Math.round(
                  (train.position / train.destination) * 100
                )}% complete</div>
            </div>
        `;

    modal.classList.remove("hidden");
    console.log(`Showing details for train ${train.id}`);
  }

  hideTrainModal() {
    const modal = document.getElementById("train-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  showAddTrainModal() {
    const modal = document.getElementById("add-train-modal");
    if (modal) {
      modal.classList.remove("hidden");
      console.log("Showing add train modal");
    }
  }

  hideAddTrainModal() {
    const modal = document.getElementById("add-train-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  handleAddTrain(e) {
    e.preventDefault();

    const trainId = document.getElementById("new-train-id").value;
    const trainType = document.getElementById("new-train-type").value;
    const trainPriority = document.getElementById("new-train-priority").value;
    const trainDestination = parseInt(
      document.getElementById("new-train-destination").value
    );

    const assignedTrack = this.assignOptimalTrack();

    const trainData = {
      id: trainId,
      type: trainType,
      priority: trainPriority,
      destination: trainDestination,
      position: 0,
      track: assignedTrack,
      status: "moving",
      speed: this.getOriginalSpeed(trainType),
    };

    this.addTrain(trainData);
    this.addAIDecision(
      `New ${trainData.type} train ${trainData.id} added to Track ${trainData.track} with ${trainData.priority} priority`,
      assignedTrack
    );
    this.highlightTrack(assignedTrack, "decision");

    e.target.reset();
    this.hideAddTrainModal();

    console.log(`Added new train: ${trainId}`);
  }

  assignOptimalTrack() {
    // AI decides best track based on current utilization
    let bestTrack = "A";
    let lowestUtilization = 1;

    Object.keys(this.tracks).forEach((trackId) => {
      const utilization =
        this.tracks[trackId].occupancy / this.tracks[trackId].capacity;
      if (utilization < lowestUtilization) {
        lowestUtilization = utilization;
        bestTrack = trackId;
      }
    });

    return bestTrack;
  }

  loadScenario(scenario) {
    this.resetSimulation();

    switch (scenario) {
      case "rush":
        this.addMultipleTrains(7, "rush hour");
        break;
      case "mixed":
        this.addMultipleTrains(5, "mixed traffic");
        break;
      default:
        // Normal traffic already loaded
        break;
    }
  }

  addMultipleTrains(count, scenarioName) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.addRandomTrain();
      }, i * 2000);
    }

    this.addAIDecision(
      `Loaded ${scenarioName} scenario with ${count} additional trains`
    );
  }

  initializeCharts() {
    try {
      // Throughput chart
      const throughputCtx = document.getElementById("throughput-chart");
      if (throughputCtx) {
        this.charts.throughput = new Chart(throughputCtx.getContext("2d"), {
          type: "line",
          data: {
            labels: [],
            datasets: [
              {
                label: "Trains/Hour",
                data: [],
                borderColor: "#3498db",
                backgroundColor: "rgba(52, 152, 219, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });
      }

      // Utilization chart
      const utilizationCtx = document.getElementById("utilization-chart");
      if (utilizationCtx) {
        this.charts.utilization = new Chart(utilizationCtx.getContext("2d"), {
          type: "bar",
          data: {
            labels: ["Track A", "Track B", "Track C"],
            datasets: [
              {
                label: "Utilization %",
                data: [0, 0, 0],
                backgroundColor: ["#3498db", "#2ecc71", "#e74c3c"],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });
      }

      console.log("Charts initialized successfully");
    } catch (error) {
      console.error("Error initializing charts:", error);
    }
  }

  recordChartData() {
    const timeLabel = this.formatTime(this.simulationTime);
    this.chartData.timeLabels.push(timeLabel);
    this.chartData.throughput.push(this.metrics.throughput);

    Object.keys(this.tracks).forEach((trackId) => {
      const utilization =
        (this.tracks[trackId].occupancy / this.tracks[trackId].capacity) * 100;
      this.chartData.utilization[trackId].push(utilization);
    });

    // Keep only last 15 data points for better visibility
    if (this.chartData.timeLabels.length > 15) {
      this.chartData.timeLabels.shift();
      this.chartData.throughput.shift();
      Object.keys(this.tracks).forEach((trackId) => {
        this.chartData.utilization[trackId].shift();
      });
    }
  }

  updateCharts() {
    try {
      // Update throughput chart
      if (this.charts.throughput) {
        this.charts.throughput.data.labels = this.chartData.timeLabels;
        this.charts.throughput.data.datasets[0].data =
          this.chartData.throughput;
        this.charts.throughput.update("none");
      }

      // Update utilization chart
      if (this.charts.utilization) {
        const currentUtilization = Object.keys(this.tracks).map(
          (trackId) =>
            (this.tracks[trackId].occupancy / this.tracks[trackId].capacity) *
            100
        );
        this.charts.utilization.data.datasets[0].data = currentUtilization;
        this.charts.utilization.update("none");
      }
    } catch (error) {
      console.error("Error updating charts:", error);
    }
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

// Initialize the simulation when the page loads
let simulator;
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing NEXUS Rail AI...");
  simulator = new RailwaySimulator();
});
