package stats

import "sort"

// Percentile calculates p50, p90, p99 from a slice of latency values (ms)
func Percentile(latencies []float64) (p50, p90, p99 float64) {
	if len(latencies) == 0 {
		return 0, 0, 0
	}

	sorted := make([]float64, len(latencies))
	copy(sorted, latencies)
	sort.Float64s(sorted)

	p50 = sorted[int(float64(len(sorted))*0.50)]
	p90 = sorted[int(float64(len(sorted))*0.90)]
	p99 = sorted[int(float64(len(sorted))*0.99)]
	return
}

// TPS calculates transactions per second from timestamps (unix ms)
func TPS(timestamps []int64) float64 {
	if len(timestamps) < 2 {
		return float64(len(timestamps))
	}

	minT := timestamps[0]
	maxT := timestamps[0]
	for _, t := range timestamps {
		if t < minT {
			minT = t
		}
		if t > maxT {
			maxT = t
		}
	}

	durationSec := float64(maxT-minT) / 1000.0
	if durationSec == 0 {
		return float64(len(timestamps))
	}
	return float64(len(timestamps)) / durationSec
}
