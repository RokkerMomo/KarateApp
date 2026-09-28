'use client';

import Button from '@mui/material/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ButtonAppBar from '../../components/navbar';
import supabase from '../config/supabase';
import { useState } from 'react';

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const login = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		alert(error ? `Error: ${error.message}` : 'Login successful!');
		if (!error) {
			router.push('/');
		}
	};

	return (
		<main className="site-shell login-shell">
			<ButtonAppBar />
			<section className="login-content" aria-labelledby="login-title">
				<div className="login-intro">
					<p className="eyebrow">Welcome back</p>
					<h1 id="login-title">
						Return to <span>practice.</span>
					</h1>
					<p className="hero-description">
						Continue your journey with Kenshu Kan. Your next session starts
						here.
					</p>
					<p className="login-mark">KENSHU KAN / 02</p>
				</div>

				<form className="login-form" onSubmit={login}>
					<div className="form-heading">
						<span>Member access</span>
						<span>01 / 02</span>
					</div>

					<label htmlFor="email">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>

					<div className="password-label">
						<label htmlFor="password">Password</label>
						<Link href="#forgot-password">Forgot password?</Link>
					</div>
					<input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>

					<Button className="mainbutton login-button" variant="contained" type="submit">
						Sign in
					</Button>

					<p className="signup-prompt">
						New to the dojo? <Link href="#join">Create an account</Link>
					</p>
				</form>
			</section>
		</main>
	);
}
