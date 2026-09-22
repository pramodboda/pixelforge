import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { OptimizationSettings } from "../types/image";

interface Props {
  settings: OptimizationSettings;
  onChange: (patch: Partial<OptimizationSettings>) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography fontWeight={600} gutterBottom>
          Output format
        </Typography>
        <Select
          fullWidth
          value={settings.outputFormat}
          onChange={(event) =>
            onChange({ outputFormat: event.target.value as OptimizationSettings["outputFormat"] })
          }
        >
          <MenuItem value="webp">WebP — recommended</MenuItem>
          <MenuItem value="avif">AVIF — smallest, slower</MenuItem>
          <MenuItem value="jpeg">JPEG</MenuItem>
          <MenuItem value="png">PNG — lossless</MenuItem>
        </Select>
      </Box>

      <Divider />

      <Box>
        <Stack direction="row" justifyContent="space-between">
          <Typography fontWeight={600}>Quality</Typography>
          <Typography color="text.secondary">{settings.quality}%</Typography>
        </Stack>
        <Slider
          value={settings.quality}
          min={10}
          max={100}
          step={1}
          valueLabelDisplay="auto"
          onChange={(_, value) => onChange({ quality: value as number })}
          disabled={settings.outputFormat === "png"}
        />
        <Typography variant="caption" color="text.secondary">
          Higher quality generally produces a larger file.
        </Typography>
      </Box>

      <Divider />

      <Box>
        <Typography fontWeight={600} gutterBottom>
          Maximum dimensions
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Width"
            type="number"
            value={settings.maxWidth ?? ""}
            onChange={(event) => {
              const value = event.target.value ? Number(event.target.value) : null;
              onChange({ maxWidth: value });
            }}
            inputProps={{ min: 1 }}
            fullWidth
          />
          <TextField
            label="Height"
            type="number"
            value={settings.maxHeight ?? ""}
            onChange={(event) => {
              const value = event.target.value ? Number(event.target.value) : null;
              onChange({ maxHeight: value });
            }}
            inputProps={{ min: 1 }}
            fullWidth
          />
        </Stack>

        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Aspect ratio is preserved. Empty fields keep the original dimension.
        </Typography>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={settings.stripMetadata}
            onChange={(event) => onChange({ stripMetadata: event.target.checked })}
          />
        }
        label="Strip metadata / EXIF"
      />
    </Stack>
  );
}