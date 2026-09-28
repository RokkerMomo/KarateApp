import Button from '@mui/material/Button';
import Image from 'next/image';
import Link from 'next/link';
import FrontIMG from '../public/FrontIMG.jpg';
import ButtonAppBar from '../components/navbar';

const Home = () => {
  return (
    <main className="site-shell">
      <ButtonAppBar />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Traditional karate · Modern discipline</p>
          <h1 id="hero-title">
            Find your <span>inner strength.</span>
          </h1>
          <p className="hero-description">
            Build focus, confidence, and control through purposeful training at
            Kenshu Kan.
          </p>
          <div className="hero-actions">
            <Link href="/login">
              <Button className="mainbutton" variant="contained">
                Start training
              </Button>
            </Link>
            <span className="hero-note">Open to all experience levels</span>
          </div>
          <div className="hero-details" aria-label="Training details">
            <div>
              <strong>01</strong>
              <span>Mindful practice</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Strong community</span>
            </div>
          </div>
      </div>

        <div className="imgcontainer">
          <Image src={FrontIMG} alt="Karate training at Kenshu Kan" fill priority />
          <div className="image-caption">
            <span className="caption-line" />
            <span>Discipline in motion</span>
          </div>
        </div>
      </section>
      <footer className="page-footer">
        <span>KENSHU KAN / 01</span>
        <span>Dojo for the dedicated</span>
      </footer>
    </main>
  )
}

export default Home