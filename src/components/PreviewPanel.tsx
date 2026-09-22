import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import type { ImageAsset } from "../types/image";
import { extensionFor, formatLabel } from "../services/format";

interface Props {
  image: ImageAsset | null;
}

const bytes = (value: number) =>
  value < 1024 ** 2 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 ** 2).toFixed(2)} MB`;

export function PreviewPanel({ image }: Props) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");

  useEffect(() => {
    if (!image) return;

    const original = URL.createObjectURL(image.file);
    setOriginalUrl(original);

    return () => URL.revokeObjectURL(original);
  }, [image]);

  useEffect(() => {
    if (!image?.outputBlob) {
      setOutputUrl("");
      return;
    }

    const output = URL.createObjectURL(image.outputBlob);
    setOutputUrl(output);

    return () => URL.revokeObjectURL(output);
  }, [image?.outputBlob]);

  if (!image) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary">
            Select an image to inspect the before/after result.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const savings =
    image.outputSize && image.originalSize
      ? Math.max(0, (1 - image.outputSize / image.originalSize) * 100)
      : null;

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Preview url={originalUrl} label="Original" />
            <Preview
              url={outputUrl || originalUrl}
              label={image.outputBlob ? "Optimized" : "Preview"}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Optimization result
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            divider={<Divider orientation="vertical" flexItem />}
            spacing={3}
          >
            <Metric label="Original" value={bytes(image.originalSize)} />
            <Metric label="Output" value={image.outputSize ? bytes(image.outputSize) : "—"} />
            <Metric label="Reduction" value={savings !== null ? `${savings.toFixed(1)}%` : "—"} />
            <Metric
              label="Format"
              value={image.outputFormat ? formatLabel(image.outputFormat) : extensionFor(image.inputFormat).toUpperCase()}
            />
          </Stack>

          {image.processingMs && (
            <Chip
              sx={{ mt: 2 }}
              label={`Processed in ${image.processingMs} ms • ${image.outputWidth} × ${image.outputHeight}`}
              variant="outlined"
            />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

function Preview({ url, label }: { url: string; label: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography fontWeight={700} mb={1}>
        {label}
      </Typography>
      <Box
        sx={{
          minHeight: 260,
          display: "grid",
          placeItems: "center",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "#f1f3f5",
          backgroundImage:
            "linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
        }}
      >
        {url ? (
          <Box component="img" src={url} alt={label} sx={{ maxWidth: "100%", maxHeight: 420, display: "block" }} />
        ) : (
          <Typography color="text.secondary">Not processed</Typography>
        )}
      </Box>
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={800}>{value}</Typography>
    </Box>
  );
}