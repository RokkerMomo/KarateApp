import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import supabase from '../app/config/supabase';

const modalStyle = {
  bgcolor: 'var(--mainblue)',
  border: '1px solid rgba(244, 240, 233, 0.16)',
  borderRadius: '16px',
  boxShadow: '0 24px 70px rgba(16, 24, 32, 0.35)',
  color: 'var(--white)',
  left: '50%',
  maxHeight: 'calc(100vh - 32px)',
  maxWidth: 'calc(100vw - 32px)',
  overflowY: 'auto',
  p: { xs: 2.5, sm: 4 },
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: 560,
};

const fieldStyle = {
  '& .MuiInputBase-input, & .MuiSelect-select': {
    color: 'var(--white)',
    fontSize: '1rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(244, 240, 233, 0.2)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(244, 240, 233, 0.45)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--mainred)',
  },
  bgcolor: 'rgba(0, 0, 0, 0.24)',
  borderRadius: '12px',
  minHeight: 60,
  width: '100%',
  p: 1.5,
};

type BasicModalProps = {
  status: string;
  studentId: string | number;
  studentName: string;
};

type StudentCharge = {
  id: string | number;
  monto: number | string | null;
  mes_periodo: number | null;
  anio_periodo: number | null;
  estado: string | null;
  fecha_vencimiento: string | null;
};

export default function BasicModal({ status, studentId, studentName }: BasicModalProps) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loadingCharges, setLoadingCharges] = React.useState(false);
  const [charges, setCharges] = React.useState<StudentCharge[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const handleOpen = () => {
    setOpen(true);
    setError(null);
  };
  const handleClose = () => {
    if (!saving) {
      setOpen(false);
      setError(null);
    }
  };
  React.useEffect(() => {
    if (!open) return;

    const loadCharges = async () => {
      setLoadingCharges(true);
      setCharges([]);
      const { data, error: chargesError } = await supabase
        .from('cargos')
        .select('id, monto, mes_periodo, anio_periodo, estado, fecha_vencimiento')
        .eq('alumno_id', studentId)
        .order('fecha_vencimiento', { ascending: false });

      if (chargesError) {
        setError(`Could not load charges: ${chargesError.message}`);
      } else {
        setCharges((data ?? []) as StudentCharge[]);
      }
      setLoadingCharges(false);
    };

    loadCharges();
  }, [open, studentId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const cargoId = formData.get('cargo-id');
    const amount = Number(formData.get('payment-amount'));
    const method = String(formData.get('payment-method') ?? '').trim();
    const reference = String(formData.get('payment-reference') ?? '').trim();

    if (!cargoId || !charges.some((charge) => String(charge.id) === cargoId)) {
      setError('Select a valid charge.');
      setSaving(false);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid payment amount.');
      setSaving(false);
      return;
    }
    if (!method) {
      setError('Select a payment method.');
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from('pagos').insert({
      cargo_id: Number(cargoId),
      monto_pagado: amount,
      metodo: method,
      referencia: reference || null,
      fecha_pago: new Date().toISOString(),
    });

    if (insertError) {
      setError(`Could not register payment: ${insertError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpen(false);
  };
  const buttonColor = status === 'Payment overdue'
    ? 'error'
    : status === 'No payment data'
      ? 'warning'
      : 'success';

  return (
    <div>
      <Button color={buttonColor} onClick={handleOpen}>
        {status}
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="payment-modal-title"
        aria-describedby="payment-modal-description"
        slotProps={{
          backdrop: {
            sx: { bgcolor: 'rgba(4, 10, 24, 0.78)', backdropFilter: 'blur(5px)' },
          },
        }}
      >
        <Box sx={modalStyle}>
          <Box sx={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5 }}>
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: 'rgba(217, 74, 61, 0.16)',
                  border: '1px solid var(--mainred)',
                  borderRadius: '10px',
                  color: 'var(--mainred)',
                  display: 'flex',
                  height: 56,
                  justifyContent: 'center',
                  width: 56,
                }}
              >
                <CreditCardIcon />
              </Box>
              <Box>
                <Typography id="payment-modal-title" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Registrar pago de mensualidad
                </Typography>
                <Typography sx={{ color: 'rgba(244, 240, 233, 0.68)', fontSize: '0.9rem', mt: 0.4 }}>
                  Alumno: <Box component="span" sx={{ color: 'var(--lightwhite)', fontWeight: 700 }}>{studentName}</Box>
                </Typography>
              </Box>
            </Box>
            <IconButton
              aria-label="Cerrar modal"
              onClick={handleClose}
              sx={{ color: 'rgba(244, 240, 233, 0.65)', mt: -1, mr: -1, '&:hover': { color: 'var(--white)' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <Box>
              <Typography component="label" htmlFor="cargo-id" sx={labelStyle}>
                Cargo a liquidar
              </Typography>
              <Box
                component="select"
                defaultValue=""
                disabled={loadingCharges || charges.length === 0}
                id="cargo-id"
                name="cargo-id"
                required
                sx={fieldStyle}
              >
                <option disabled value="">
                  {loadingCharges ? 'Cargando cargos...' : charges.length === 0 ? 'No hay cargos disponibles' : 'Seleccione un cargo'}
                </option>
                {charges.map((charge) => (
                  <option key={charge.id} value={charge.id}>
                    {formatCharge(charge)}
                  </option>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography component="label" htmlFor="payment-amount" sx={labelStyle}>
                Monto a abonar ($)
              </Typography>
              <Box
                component="input"
                id="payment-amount"
                name="payment-amount"
                required
                type="number"
                placeholder="35"
                sx={fieldStyle}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="payment-method" sx={labelStyle}>
                Método de pago
              </Typography>
              <Box component="select" defaultValue="" id="payment-method" name="payment-method" required sx={fieldStyle}>
                <option disabled value="">Seleccione un método</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Depósito</option>
              </Box>
            </Box>

            <Box>
              <Typography component="label" htmlFor="payment-reference" sx={labelStyle}>
                N° de referencia / comprobante
              </Typography>
              <Box
                component="input"
                id="payment-reference"
                name="payment-reference"
                placeholder="Ej. 98401928"
                sx={fieldStyle}
                type="text"
              />
            </Box>

            <Box
              id="payment-modal-description"
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.24)',
                border: '1px solid rgba(244, 240, 233, 0.16)',
                borderRadius: '12px',
                color: 'rgba(244, 240, 233, 0.72)',
                fontSize: '0.9rem',
                lineHeight: 1.45,
                p: 2,
              }}
            >
              El pago se registrará en la tabla de pagos y actualizará el estado del alumno.
            </Box>

            {error && (
              <Typography role="alert" sx={{ color: 'var(--mainred)', fontSize: '0.9rem', fontWeight: 700 }}>
                {error}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                onClick={handleClose}
                disabled={saving}
                sx={{ color: 'rgba(244, 240, 233, 0.72)', fontSize: '0.9rem', fontWeight: 700, px: 2, py: 1.25, textTransform: 'none' }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  bgcolor: 'var(--mainred)',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  px: 3,
                  py: 1.25,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#bd3e34', boxShadow: 'none' },
                }}
              >
                {saving ? 'Guardando...' : 'Procesar pago'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}

const labelStyle = {
  color: 'rgba(244, 240, 233, 0.76)',
  display: 'block',
  fontSize: '0.9rem',
  fontWeight: 700,
  mb: 0.75,
};

function formatCharge(charge: StudentCharge) {
  const period = charge.mes_periodo && charge.anio_periodo
    ? `${String(charge.mes_periodo).padStart(2, '0')}/${charge.anio_periodo}`
    : charge.fecha_vencimiento ?? 'Sin fecha';
  const amount = Number(charge.monto ?? 0).toFixed(2);
  return `${period} - $${amount} (${charge.estado ?? 'pendiente'})`;
}
