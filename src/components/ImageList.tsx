import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import type { ImageAsset } from "../types/image";
import { formatLabel } from "../services/format";

interface Props {
  images: ImageAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

export function ImageList({ images, selectedId, onSelect, onRemove }: Props) {
  return (
    <List disablePadding>
      {images.map((image) => {
        const savings =
          image.outputSize && image.originalSize
            ? Math.max(0, (1 - image.outputSize / image.originalSize) * 100)
            : null;

        return (
          <ListItem
            key={image.id}
            onClick={() => onSelect(image.id)}
            sx={{
              mb: 1,
              borderRadius: 2,
              cursor: "pointer",
              bgcolor: selectedId === image.id ? "action.selected" : "transparent",
            }}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(image.id);
                }}
                aria-label={`Remove ${image.name}`}
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center" pr={5}>
                  <Typography noWrap fontWeight={700}>
                    {image.name}
                  </Typography>
                  {image.status === "completed" && (
                    <CheckCircleRoundedIcon color="success" fontSize="small" />
                  )}
                  {image.status === "error" && <ErrorOutlineRoundedIcon color="error" fontSize="small" />}
                </Stack>
              }
              secondary={
                <Box mt={0.5}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={formatLabel(image.inputFormat)} />
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(image.originalSize)}
                    </Typography>
                    {savings !== null && (
                      <Typography variant="caption" color="success.main" fontWeight={700}>
                        {savings.toFixed(1)}% smaller
                      </Typography>
                    )}
                  </Stack>

                  {image.status === "processing" && (
                    <LinearProgress variant="determinate" value={image.progress} sx={{ mt: 1 }} />
                  )}

                  {image.error && (
                    <Typography variant="caption" color="error.main">
                      {image.error}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
}