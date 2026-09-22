import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { DropZone } from "./DropZone";
import { SettingsPanel } from "./SettingsPanel";
import { ImageList } from "./ImageList";
import { PreviewPanel } from "./PreviewPanel";
import { useImageStore } from "../store/imageStore";
import { ImageWorkerClient } from "../services/workerClient";
import { extensionFor } from "../services/format";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5b4bdb" },
    secondary: { main: "#111827" },
    background: { default: "#f7f7fb", paper: "#ffffff" },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
});

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function App() {
  const { images, settings, selectedId, addFiles, removeImage, clear, updateImage, select, setSettings } =
    useImageStore();

  const workerRef = useRef<ImageWorkerClient | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    workerRef.current = new ImageWorkerClient();

    return () => workerRef.current?.terminate();
  }, []);

  const selected = useMemo(
    () => images.find((image) => image.id === selectedId) ?? null,
    [images, selectedId],
  );

  const completed = images.filter((image) => image.status === "completed");

  const processImage = async (id: string) => {
    const image = useImageStore.getState().images.find((item) => item.id === id);
    if (!image || !workerRef.current) return;

    updateImage(id, { status: "processing", progress: 0, error: undefined });

    try {
      const result = await workerRef.current.process(image, settings, (progress) => {
        updateImage(id, { progress });
      });

      if (!result.buffer) throw new Error("The encoder returned no data.");

      const blob = new Blob([result.buffer], { type: result.outputMime });

      updateImage(id, {
        status: "completed",
        progress: 100,
        outputBlob: blob,
        outputSize: blob.size,
        outputWidth: result.width,
        outputHeight: result.height,
        outputFormat: settings.outputFormat,
        processingMs: result.processingMs,
      });
    } catch (error) {
      updateImage(id, {
        status: "error",
        error: error instanceof Error ? error.message : "Processing failed.",
      });
    }
  };

  const optimizeAll = async () => {
    // Sequential processing deliberately limits memory pressure when users
    // select many large photographs. The UI remains responsive because the
    // actual image work runs in the Web Worker.
    for (const image of useImageStore.getState().images) {
      await processImage(image.id);
    }
  };

  const downloadSelected = () => {
    if (!selected?.outputBlob) return;

    const baseName = selected.name.replace(/\.[^/.]+$/, "");
    saveBlob(
      selected.outputBlob,
      `${baseName}-optimized.${extensionFor(selected.outputFormat ?? settings.outputFormat)}`,
    );
  };

  const downloadAll = () => {
    // Browser downloads are intentionally individual files to avoid adding a
    // ZIP dependency. A future v2 can add client-side ZIP creation.
    completed.forEach((image) => {
      if (!image.outputBlob) return;
      const baseName = image.name.replace(/\.[^/.]+$/, "");
      saveBlob(
        image.outputBlob,
        `${baseName}-optimized.${extensionFor(image.outputFormat ?? settings.outputFormat)}`,
      );
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AutoAwesomeRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography fontWeight={900} lineHeight={1}>
                PixelForge
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Local Image Optimization Studio
              </Typography>
            </Box>
          </Stack>

          <Chip icon={<LockRoundedIcon />} label="100% Local" color="success" variant="outlined" />
          <Tooltip title="Optimization settings">
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ ml: 1 }}>
              <TuneRoundedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 3, md: 4 }, background: "linear-gradient(135deg,#111827,#30256f)", color: "white" }}>
            <Stack spacing={1}>
              <Typography variant="h3" fontWeight={900} sx={{ fontSize: { xs: "2.2rem", md: "3.2rem" } }}>
                Compress. Convert. Optimize.
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.82, maxWidth: 760 }}>
                Professional image optimization that runs entirely in your browser. Your files stay on your device.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                <Chip label="JPEG" sx={{ bgcolor: "rgba(255,255,255,.12)", color: "white" }} />
                <Chip label="PNG" sx={{ bgcolor: "rgba(255,255,255,.12)", color: "white" }} />
                <Chip label="WebP" sx={{ bgcolor: "rgba(255,255,255,.12)", color: "white" }} />
                <Chip label="AVIF" sx={{ bgcolor: "rgba(255,255,255,.12)", color: "white" }} />
                <Chip label="Web Worker + WASM" sx={{ bgcolor: "rgba(255,255,255,.12)", color: "white" }} />
              </Stack>
            </Stack>
          </Paper>

          {images.length === 0 ? (
            <DropZone onFiles={addFiles} />
          ) : (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5" fontWeight={900}>
                    Images
                  </Typography>
                  <Chip label={images.length} size="small" />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button startIcon={<DeleteSweepRoundedIcon />} onClick={clear}>
                    Clear
                  </Button>
                  <Button variant="outlined" onClick={() => document.getElementById("hidden-add-input")?.click()}>
                    Add more
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeRoundedIcon />}
                    onClick={optimizeAll}
                    disabled={images.some((image) => image.status === "processing")}
                  >
                    Optimize all
                  </Button>
                  <input
                    id="hidden-add-input"
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    onChange={(event) => {
                      if (event.target.files) addFiles(Array.from(event.target.files));
                      event.target.value = "";
                    }}
                  />
                </Stack>
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, alignSelf: "start" }}>
                  <ImageList
                    images={images}
                    selectedId={selectedId}
                    onSelect={select}
                    onRemove={removeImage}
                  />
                </Paper>

                <PreviewPanel image={selected} />
              </Box>

              {selected && !selected.outputBlob && (
                <Alert
                  severity="info"
                  action={
                    <Button color="inherit" size="small" onClick={() => processImage(selected.id)}>
                      Optimize selected
                    </Button>
                  }
                >
                  Choose your settings, then optimize the selected image or process the whole batch.
                </Alert>
              )}

              {completed.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography fontWeight={900}>Ready to download</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {completed.length} optimized image{completed.length === 1 ? "" : "s"} available locally.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {selected?.outputBlob && (
                        <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={downloadSelected}>
                          Download selected
                        </Button>
                      )}
                      <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={downloadAll}>
                        Download all
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </>
          )}

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Feature title="Private by design" text="Images are processed locally. There is no image upload API or cloud storage." />
            <Feature title="Fast UI" text="CPU-heavy processing runs in a dedicated Web Worker so the interface stays responsive." />
            <Feature title="Modern formats" text="Export to JPEG, PNG, WebP or AVIF with configurable quality and dimensions." />
          </Stack>
        </Stack>
      </Container>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: "100vw", sm: 390 }, p: 3 }}>
          <Typography variant="h5" fontWeight={900} mb={0.5}>
            Optimization settings
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Settings apply to the next optimization operation.
          </Typography>

          <SettingsPanel settings={settings} onChange={setSettings} />

          <Button fullWidth variant="contained" sx={{ mt: 4 }} onClick={() => setDrawerOpen(false)}>
            Apply settings
          </Button>
        </Box>
      </Drawer>
    </ThemeProvider>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography fontWeight={900}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
}