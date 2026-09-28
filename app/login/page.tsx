import Button from '@mui/material/Button';
import Link from 'next/link';
import ButtonAppBar from '../../components/navbar';

export default function LoginPage() {
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

				<form className="login-form">
					<div className="form-heading">
						<span>Member access</span>
						<span>01 / 02</span>
					</div>

					<label htmlFor="email">Email address</label>
					<input id="email" name="email" type="email" autoComplete="email" required />

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
