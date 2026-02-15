# Calculation Modules Parameters Documentation

This document provides a comprehensive guide to the parameters required for each of the 9 calculation modules in the Workings API. This documentation is intended for frontend developers consuming the calculation API.

## API Endpoint

**Base URL:** `POST /api/v1/calculations/calculate`

**Request Body Structure:**
```json
{
  "projectCart": [
    {
      "module_id": "M1_Casement_DCurve",
      // ... module-specific parameters
    }
  ],
  "settings": {
    "stockLength": 6,        // Optional: 6 or 5.58 (meters)
    "bladeKerf": 2,          // Optional: Blade kerf in mm
    "wasteThreshold": 200    // Optional: Waste threshold in mm
  }
}
```

---

## Module Overview

| Module ID | Module Name | Category |
|-----------|-------------|----------|
| `M1_Casement_DCurve` | Casement Window (D/Curve) | Windows |
| `M2_Sliding_2Sash` | Sliding Window (Standard 2-Sash) | Windows |
| `M3_Sliding_2Sash_Net` | Sliding Window (2-Sash + Fixed Net) | Windows |
| `M4_Sliding_3Track` | Sliding Window (3-Track, 2 Glass + 1 Net) | Windows |
| `M5_Sliding_3Sash` | Sliding Window (3-Sash, All-Glass) | Windows |
| `M6_Net_1125_26` | 1125/26 Net (1132-panel) | Nets |
| `M7_EBM_Net_1125_26` | EBM-net (1125/26 Frame) | Nets |
| `M8_EBM_Net_UChannel` | EBM-Net (U-Channel) | Nets |
| `M9_Curtain_Wall_Grid` | Curtain Wall Window (Advanced Grid) | Windows |

---

## Module 1: Casement Window (D/Curve)

**Module ID:** `M1_Casement_DCurve`

**Description:** Calculates materials, cutting plans, and glass requirements for Casement Windows with D/Curve profile.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M1_Casement_DCurve"` | - | Required |
| `W` | number | Width of the window | mm | Required, > 0 |
| `H` | number | Height of the window | mm | Required, > 0 |
| `N` | number | Number of panels | - | Required, 1-5 (integer) |
| `O` | number | Number of opening panels | - | Required, ≥ 0 (integer) |
| `qty` | number | Quantity of windows | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M1_Casement_DCurve",
      "W": 2400,
      "H": 1500,
      "N": 3,
      "O": 1,
      "qty": 2
    }
  ]
}
```

### Notes

- `N` (panels) must be between 1 and 5
- `O` (opening panels) cannot exceed `N`
- The module calculates D/Curve profile length, frame profiles (Transom, Jamb), mullions, and glass dimensions

---

## Module 2: Sliding Window (Standard 2-Sash)

**Module ID:** `M2_Sliding_2Sash`

**Description:** Calculates materials, cutting plans, and glass requirements for Standard 2-Sash Sliding Windows.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M2_Sliding_2Sash"` | - | Required |
| `W` | number | Width of the window | mm | Required, > 0 |
| `H` | number | Height of the window | mm | Required, > 0 |
| `qty` | number | Quantity of windows | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M2_Sliding_2Sash",
      "W": 1800,
      "H": 1200,
      "qty": 4
    }
  ]
}
```

### Notes

- Creates 2 glass panels per window (each sash is half the track width)
- Includes Jamb, Lock Stile, Track, and Transom profiles
- Accessories: Rollers (4 per window), Lock (1 per window), Handle (1 per window)

---

## Module 3: Sliding Window (2-Sash + Fixed Net)

**Module ID:** `M3_Sliding_2Sash_Net`

**Description:** Calculates materials, cutting plans, and glass/net requirements for Sliding Windows with 2 glass sashes and 1 fixed net panel.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M3_Sliding_2Sash_Net"` | - | Required |
| `W` | number | Width of the window | mm | Required, > 0 |
| `H` | number | Height of the window | mm | Required, > 0 |
| `qty` | number | Quantity of windows | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M3_Sliding_2Sash_Net",
      "W": 2000,
      "H": 1400,
      "qty": 3
    }
  ]
}
```

### Notes

- Creates 2 glass panels and 1 fixed net panel per window
- Includes Net Frame profile in addition to standard sliding window components
- Accessories include Net Panel (1125/26) in addition to standard sliding window accessories

---

## Module 4: Sliding Window (3-Track, 2 Glass + 1 Net)

**Module ID:** `M4_Sliding_3Track`

**Description:** Calculates materials, cutting plans, and glass/net requirements for Sliding Windows with 3 tracks: 2 glass sashes and 1 net panel.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M4_Sliding_3Track"` | - | Required |
| `W` | number | Width of the window | mm | Required, > 0 |
| `H` | number | Height of the window | mm | Required, > 0 |
| `qty` | number | Quantity of windows | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M4_Sliding_3Track",
      "W": 2400,
      "H": 1500,
      "qty": 2
    }
  ]
}
```

### Notes

- Creates 2 glass panels and 1 net panel (each takes 1/3 of track width)
- Uses 3-track sliding system
- Accessories: Rollers (6 per window), Lock (1 per window), Handles (2 per window), Net Panel (1 per window)

---

## Module 5: Sliding Window (3-Sash, All-Glass)

**Module ID:** `M5_Sliding_3Sash`

**Description:** Calculates materials, cutting plans, and glass requirements for Sliding Windows with 3 glass sashes (all-glass configuration).

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M5_Sliding_3Sash"` | - | Required |
| `W` | number | Width of the window | mm | Required, > 0 |
| `H` | number | Height of the window | mm | Required, > 0 |
| `qty` | number | Quantity of windows | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M5_Sliding_3Sash",
      "W": 3000,
      "H": 1600,
      "qty": 1
    }
  ]
}
```

### Notes

- Creates 3 glass panels per window (each takes 1/3 of track width)
- All-glass configuration (no net panels)
- Accessories: Rollers (6 per window), Lock (1 per window), Handles (2 per window)

---

## Module 6: 1125/26 Net (1132-panel)

**Module ID:** `M6_Net_1125_26`

**Description:** Calculates materials, cutting plans, and net requirements for 1125/26 Net with 1132-panel configuration.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M6_Net_1125_26"` | - | Required |
| `in_to_in_width` | number | Inside-to-inside width | mm | Required, > 0 |
| `in_to_in_height` | number | Inside-to-inside height | mm | Required, > 0 |
| `qty` | number | Quantity of nets | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M6_Net_1125_26",
      "in_to_in_width": 1200,
      "in_to_in_height": 800,
      "qty": 5
    }
  ]
}
```

### Notes

- Uses **inside-to-inside dimensions** (not overall dimensions)
- Frame dimensions are calculated by adding frame thickness to inside dimensions
- Uses 1125/26 profile for frame
- Accessories: Net Clips (4 per net), Corner Bracket (4 per net)

---

## Module 7: EBM-net (1125/26 Frame)

**Module ID:** `M7_EBM_Net_1125_26`

**Description:** Calculates materials, cutting plans, and net requirements for EBM-net with 1125/26 Frame configuration.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M7_EBM_Net_1125_26"` | - | Required |
| `in_to_in_width` | number | Inside-to-inside width | mm | Required, > 0 |
| `in_to_in_height` | number | Inside-to-inside height | mm | Required, > 0 |
| `qty` | number | Quantity of nets | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M7_EBM_Net_1125_26",
      "in_to_in_width": 1500,
      "in_to_in_height": 1000,
      "qty": 3
    }
  ]
}
```

### Notes

- Uses **inside-to-inside dimensions** (not overall dimensions)
- EBM frame is typically thicker than standard 1125/26 frame
- Accessories: EBM Net Clips (4 per net), EBM Corner Bracket (4 per net), EBM Mounting Screws (8 per net)

---

## Module 8: EBM-Net (U-Channel)

**Module ID:** `M8_EBM_Net_UChannel`

**Description:** Calculates materials, cutting plans, and net requirements for EBM-Net with U-Channel frame configuration.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M8_EBM_Net_UChannel"` | - | Required |
| `in_to_in_width` | number | Inside-to-inside width | mm | Required, > 0 |
| `in_to_in_height` | number | Inside-to-inside height | mm | Required, > 0 |
| `qty` | number | Quantity of nets | - | Required, > 0 (integer) |

### Example Request

```json
{
  "projectCart": [
    {
      "module_id": "M8_EBM_Net_UChannel",
      "in_to_in_width": 1800,
      "in_to_in_height": 1200,
      "qty": 2
    }
  ]
}
```

### Notes

- Uses **inside-to-inside dimensions** (not overall dimensions)
- U-Channel frame is wider than standard EBM frame
- Accessories: U-Channel Clips (6 per net), U-Channel Corner Bracket (4 per net), U-Channel Mounting Hardware (12 per net)

---

## Module 9: Curtain Wall Window (Advanced Grid)

**Module ID:** `M9_Curtain_Wall_Grid`

**Description:** Calculates materials, cutting plans, and glass requirements for Curtain Wall Windows with advanced grid configuration.

### Required Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `module_id` | string | Must be `"M9_Curtain_Wall_Grid"` | - | Required |
| `W` | number | Total width of the curtain wall | mm | Required, > 0 |
| `H` | number | Total height of the curtain wall | mm | Required, > 0 |
| `N_v` | number | Number of vertical panels (columns) | - | Required, ≥ 1 (integer) |
| `N_h` | number | Number of horizontal panels (rows) | - | Required, ≥ 1 (integer) |
| `qty` | number | Quantity of curtain walls | - | Required, > 0 (integer) |

### Optional Parameters

| Parameter | Type | Description | Units | Constraints |
|-----------|------|-------------|-------|-------------|
| `cell_heights` | number[] | Array of cell heights (one per row) | mm | Optional, length must equal `N_h` |
| `cell_width` | number[] | Array of cell widths (one per column) | mm | Optional, length must equal `N_v` |

### Example Request (Even Grid)

```json
{
  "projectCart": [
    {
      "module_id": "M9_Curtain_Wall_Grid",
      "W": 6000,
      "H": 3000,
      "N_v": 3,
      "N_h": 2,
      "qty": 1
    }
  ]
}
```

### Example Request (Custom Cell Dimensions)

```json
{
  "projectCart": [
    {
      "module_id": "M9_Curtain_Wall_Grid",
      "W": 6000,
      "H": 3000,
      "N_v": 3,
      "N_h": 2,
      "cell_heights": [1500, 1500],
      "cell_width": [2000, 2000, 2000],
      "qty": 1
    }
  ]
}
```

### Notes

- If `cell_heights` is not provided, height is divided evenly by `N_h`
- If `cell_width` is not provided, width is divided evenly by `N_v`
- If provided, `cell_heights` array length must equal `N_h`
- If provided, `cell_width` array length must equal `N_v`
- Creates vertical and horizontal mullions based on grid configuration
- Total number of glass panels = `N_v × N_h × qty`

---

## Common Parameters Summary

### All Modules

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `module_id` | string | Module identifier | ✅ Yes |
| `qty` | number | Quantity | ✅ Yes |

### Window Modules (M1-M5, M9)

| Parameter | Type | Description | Used By |
|-----------|------|-------------|---------|
| `W` | number | Width (mm) | M1, M2, M3, M4, M5, M9 |
| `H` | number | Height (mm) | M1, M2, M3, M4, M5, M9 |
| `N` | number | Number of panels | M1 only |
| `O` | number | Opening panels | M1 only |
| `N_v` | number | Vertical panels | M9 only |
| `N_h` | number | Horizontal panels | M9 only |
| `cell_heights` | number[] | Cell heights array | M9 only (optional) |
| `cell_width` | number[] | Cell widths array | M9 only (optional) |

### Net Modules (M6-M8)

| Parameter | Type | Description | Used By |
|-----------|------|-------------|---------|
| `in_to_in_width` | number | Inside-to-inside width (mm) | M6, M7, M8 |
| `in_to_in_height` | number | Inside-to-inside height (mm) | M6, M7, M8 |

---

## Calculation Settings (Optional)

All modules support optional calculation settings:

| Parameter | Type | Description | Default | Constraints |
|-----------|------|-------------|---------|-------------|
| `stockLength` | number | Stock length for cutting optimization | 6 | 6 or 5.58 (meters) |
| `bladeKerf` | number | Blade kerf width | - | > 0 (mm) |
| `wasteThreshold` | number | Waste threshold for optimization | - | > 0 (mm) |

### Example with Settings

```json
{
  "projectCart": [
    {
      "module_id": "M2_Sliding_2Sash",
      "W": 1800,
      "H": 1200,
      "qty": 4
    }
  ],
  "settings": {
    "stockLength": 5.58,
    "bladeKerf": 2,
    "wasteThreshold": 200
  }
}
```

---

## Response Structure

All modules return the same response structure:

```typescript
{
  materialList: Array<{
    item: string;
    units: number;
    type: 'Profile' | 'Accessory_Pair' | 'Sheet' | 'Roll' | 'Meter';
    unitPrice?: number;
    totalPrice?: number;
  }>;
  cuttingList: Array<{
    profile_name: string;
    stock_length: number;
    plan: Array<Record<string, string[]>>;
  }>;
  glassList: {
    sheet_type: string;
    total_sheets: number;
    cuts: Array<{
      h: number;
      w: number;
      qty: number;
    }>;
  };
  rubberTotals: Array<{
    name: string;
    total_meters: number;
  }>;
  accessoryTotals: Array<{
    name: string;
    qty: number;
  }>;
}
```

---

## Validation Rules

### General Rules

1. All numeric parameters must be positive numbers
2. Integer parameters (`N`, `O`, `qty`, `N_v`, `N_h`) must be whole numbers
3. `module_id` must match one of the supported module IDs exactly
4. `qty` must be at least 1

### Module-Specific Rules

- **M1**: `N` must be between 1 and 5, `O` cannot exceed `N`
- **M9**: `N_v` and `N_h` must be at least 1; if `cell_heights` is provided, length must equal `N_h`; if `cell_width` is provided, length must equal `N_v`

---

## Error Handling

The API will return validation errors if:

- Required parameters are missing
- Parameter types are incorrect
- Parameter values are outside valid ranges
- Array lengths don't match grid dimensions (M9)
- Invalid `module_id` is provided

Example error response:

```json
{
  "error": "Invalid casement window parameters",
  "details": "W must be greater than 0"
}
```

---

## Best Practices for Frontend

1. **Always validate on frontend** before sending to API
2. **Use appropriate units**: All dimensions are in millimeters (mm)
3. **Handle optional parameters**: For M9, you can omit `cell_heights` and `cell_width` for even grids
4. **Quantity handling**: Ensure `qty` is always a positive integer
5. **Module ID**: Use exact module IDs as specified (case-sensitive)
6. **Net modules**: Remember that M6, M7, M8 use `in_to_in_width` and `in_to_in_height`, not `W` and `H`

---

## Quick Reference Table

| Module | Width Param | Height Param | Special Params |
|--------|-------------|--------------|----------------|
| M1 | `W` | `H` | `N`, `O` |
| M2 | `W` | `H` | - |
| M3 | `W` | `H` | - |
| M4 | `W` | `H` | - |
| M5 | `W` | `H` | - |
| M6 | `in_to_in_width` | `in_to_in_height` | - |
| M7 | `in_to_in_width` | `in_to_in_height` | - |
| M8 | `in_to_in_width` | `in_to_in_height` | - |
| M9 | `W` | `H` | `N_v`, `N_h`, `cell_heights[]`, `cell_width[]` |

---

## Support

For additional support or questions about module parameters, please refer to the main API documentation or contact the development team.

