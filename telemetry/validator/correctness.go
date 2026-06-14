package validator

import "sort"

// Order represents a single order for correctness checking
type Order struct {
	OrderID   string
	Side      string
	Price     float64
	Quantity  int
	Timestamp int64
	Filled    bool
	FillPrice float64
}

// CheckPriceTimePriority validates that orders follow price-time priority rules.
// Rule: Among orders at the same price, earlier order must fill first.
// Returns a score 0-100 (100 = perfect correctness)
func CheckPriceTimePriority(orders []Order) float64 {
	if len(orders) == 0 {
		return 100.0
	}

	// Group buy orders by price
	priceGroups := make(map[float64][]Order)
	for _, o := range orders {
		if o.Side == "buy" && o.Filled {
			priceGroups[o.Price] = append(priceGroups[o.Price], o)
		}
	}

	totalChecked := 0
	violations := 0

	for _, group := range priceGroups {
		if len(group) < 2 {
			continue
		}

		// Sort by timestamp (expected fill order)
		sort.Slice(group, func(i, j int) bool {
			return group[i].Timestamp < group[j].Timestamp
		})

		// Check each consecutive pair — earlier order must fill first
		for i := 0; i < len(group)-1; i++ {
			totalChecked++
			// If later order filled before earlier one — violation
			if group[i+1].FillPrice > 0 && group[i].FillPrice == 0 {
				violations++
			}
		}
	}

	if totalChecked == 0 {
		return 100.0
	}

	score := (1.0 - float64(violations)/float64(totalChecked)) * 100.0
	return score
}
