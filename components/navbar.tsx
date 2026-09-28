'use client'
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import BasicMenu from './menu';
import '../app/globals.css'
import Link from 'next/link';

export default function ButtonAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'var(--mainblue)', color: 'var(--white)' }}>
        <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, md: 5 } }}>
          <BasicMenu />

          <Typography component="div" sx={{ flexGrow: 1, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.18em' }}>
            <Link href="/">
              KENSHU <span style={{ color: 'var(--mainred)' }}>KAN</span>
            </Link>

          </Typography>

          <Button color="inherit" sx={{ fontSize: '0.72rem', letterSpacing: '0.12em' }}>CONTACT</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
