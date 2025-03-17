import React, { useState } from "react";
import { Check, Save } from "@mui/icons-material";
import { Box, CircularProgress, Fab } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { green, red } from "@mui/material/colors";

const Actions = ({ params, rowId, setRowId, updateData, deleteData }: any) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    setTimeout(async () => {
      const { name, category, detail, amount, date, type, paymethod, dues } =
        params.row;
      await updateData(params.id, {
        name,
        category,
        detail,
        amount,
        date,
        type,
        paymethod,
        dues,
      });
      setRowId(null);
      setLoading(false);
    }, 1500);
    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
    }, 1000);
  };

  const handleDelete = async () => {
    setLoading(true);
    setTimeout(async () => {
      await deleteData(params.id);
      setRowId(null);
      setLoading(false);
    }, 1500);
    setSuccess(true);
  };

  return (
    <Box
      sx={{
        m: 1,
        position: "relative",
      }}
    >
      {success ? (
        <Fab
          color="primary"
          sx={{
            width: 40,
            height: 40,
            bgcolor: green[500],
            "&:hover": {
              bgcolor: green[700],
            },
          }}
        >
          <Check />
        </Fab>
      ) : (
        <>
          <Fab
            color="primary"
            sx={{
              width: 40,
              height: 40,
              bgcolor: green[500],
            }}
            disabled={params.id !== rowId || loading}
            title="Guardar edición"
            onClick={() => {
              handleUpdate();
            }}
          >
            <Save />
          </Fab>
          <Fab
            color="primary"
            sx={{
              width: 40,
              height: 40,
              margin: "0 20px",
              bgcolor: red[300],
              "&:hover": {
                bgcolor: red[400],
              },
            }}
            onClick={() => {
              handleDelete();
            }}
            title="Eliminar, esta operación no se puede deshacer"
          >
            <DeleteForeverIcon />
          </Fab>
        </>
      )}
      {loading && (
        <CircularProgress
          size={52}
          sx={{
            color: green[500],
            position: "absolute",
            top: -6,
            left: -6,
            zIndex: 1,
          }}
        />
      )}
    </Box>
  );
};

export default Actions;
