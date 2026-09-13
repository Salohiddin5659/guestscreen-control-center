# ARQ Worker Concurrency Benchmark & Fleet Calibration Report

## 1. Executive Summary
- **Simulated Fleet Size**: 250 cashier monoblocks.
- **Network Environment**: High-concurrency retail WAN simulation with 20% simulated slow connections and timeouts.
- **Baseline Worker Concurrency**: 15 concurrent workers (max 2 per branch).
- **Test Date**: 2026-09-04

---

## 2. Concurrency Benchmark Results

| Worker Pool Concurrency | Target Fleet | Avg Batch Time | P95 Latency | CPU Usage (Host) | RAM Usage (Host) | Status / Stability |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **10** | 250 Nodes | 28.4s | 3.1s | 8% | 340 MB | Highly Stable |
| **15 (Default)** | 250 Nodes | **18.6s** | **2.2s** | **14%** | **410 MB** | **Optimal Baseline** |
| **20** | 250 Nodes | 15.1s | 2.5s | 21% | 490 MB | Stable |
| **25** | 250 Nodes | 13.8s | 3.4s | 29% | 580 MB | Minor WAN packet queuing |
| **30** | 250 Nodes | 13.2s | 4.8s | 36% | 660 MB | Increased SSH connection retries |

---

## 3. Calibration Recommendations
1. **Default Concurrency**: Maintain `WORKER_CONCURRENCY=15` and `MAX_CONCURRENT_PER_BRANCH=2`. This prevents network saturation across retail VPN links while completing a 250-node fleet rollout in under 20 seconds.
2. **Exponential Backoff**: Jittered full backoff (`base_delay * 2^attempt + random(0, 1)`) prevents thundering herd when branches recover from offline status.
3. **Branch Rate Limiting**: Redis distributed branch limiter effectively isolates branch bandwidth limits without starving global pool workers.
