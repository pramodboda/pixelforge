import { useRef, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import type { ChangeEvent, DragEvent } from "react";
import { isSupportedImage } from "../services/format";

import "./glass.css"


import { MdOutlineFileUpload } from "react-icons/md";


interface Props {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter(isSupportedImage);
    if (valid.length) onFiles(valid);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) acceptFiles(event.target.files);
    // Reset the input so selecting the same file twice still fires onChange.
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(event.dataTransfer.files);
  };

  return (
    <Box
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      sx={{
        p: { xs: 4, md: 7 },
        textAlign: "center",
        border: "2px dashed",
        borderColor: dragging ? "primary.main" : "divider",
        bgcolor: dragging ? "action.hover" : "background.paper",
        transition: "all .2s ease",
        borderRadius: "16px"
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <Box
          className="glass"
          sx={{
            width: 72,
            height: 72,
            // borderRadius: 3,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            // bgcolor: "primary.main",
            // color: "primary.contrastText",
          }}
        >
          {/* <CloudUploadRoundedIcon fontSize="large" />? */}
          <MdOutlineFileUpload fontSize="1.8rem" />

        </Box>

        <Typography variant="h5" fontWeight={800}>
          Drop your images here
        </Typography>

        <Typography color="text.secondary">
          JPG, PNG, WebP and AVIF • Processed locally in your browser
        </Typography>

        <Button variant="contained" size="large" onClick={() => inputRef.current?.click()}>
          Select images
        </Button>

        <Typography variant="caption" color="text.secondary">
          Multiple files are supported. Nothing is uploaded to a server.
        </Typography>
      </Stack >

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={handleChange}
      />
    </Box >
  );
}