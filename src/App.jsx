import PsyShader from "./PsyShader";

const SC_PLAYER =
  "https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F154472825&show_artwork=true&auto_play=false&hide_related=true&show_comments=false&show_teaser=false&color=%23ffffff";

export default function App() {
  return (
    <div className="site">
      <PsyShader />
      <header className="hero">
        <h1>Breaking Robots</h1>
        <p>Experimental Electronic Collective – Brighton, UK</p>
        <p>Promoting the human awakening process through music and performance.</p>
        <nav className="section-nav" aria-label="Site">
          <a href="#music">Music</a>
          <a href="#events">Events</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <section id="music" className="section">
        <h2>Music</h2>
        <p>Resolution of Index 0.1, recorded in 2014.</p>
        <div className="sc-embed">
          <iframe
            title="Resolution of Index 0.1 by Breaking Robots"
            width="100%"
            height="400"
            scrolling="no"
            frameBorder="no"
            allow="encrypted-media"
            src={SC_PLAYER}
          />
        </div>
        <p className="sc-link">
          <a
            href="https://soundcloud.com/breaking-robots"
            target="_blank"
            rel="noopener noreferrer"
          >
            SoundCloud
          </a>
        </p>
      </section>
      <section id="events" className="section">
        <h2>Events</h2>
        <p>Past performances in Brighton, 2014.</p>
        <ul className="events">
          <li>
            <a
              href="https://www.mixcloud.com/BreakingRobots/breakingrobots-19-july-2014-beepstock-festival-brighton/"
              target="_blank"
              rel="noopener noreferrer"
            >
              [beep]stock Festival
            </a>
            <time dateTime="2014-07-19">19 July 2014</time>
          </li>
          <li>
            <a
              href="https://www.mixcloud.com/Prisss/follow-the-instructions/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow The Instructions, The Verdict
            </a>
            <time dateTime="2014-09-06">6 September 2014</time>
          </li>
          <li>
            <a
              href="https://www.mixcloud.com/Prisss/breaking-robots-at-spirit-of-gravity-27-november-2014/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Spirit of Gravity, Green Door Store
            </a>
            <time dateTime="2014-11-27">27 November 2014</time>
          </li>
        </ul>
        <p className="events-note">
          Live recordings are on{" "}
          <a
            href="https://www.mixcloud.com/BreakingRobots/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mixcloud
          </a>
          .
        </p>
      </section>
      <section id="contact" className="section">
        <h2>Contact &amp; Community</h2>
        <p>Join us on Facebook and connect with the [beep] collective.</p>
        <nav className="social section-nav" aria-label="Social">
          <a
            href="https://www.facebook.com/BreakingRobotsOfTzion"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
          <a
            href="https://www.mixcloud.com/BreakingRobots/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mixcloud
          </a>
          <a
            href="https://soundcloud.com/breaking-robots"
            target="_blank"
            rel="noopener noreferrer"
          >
            SoundCloud
          </a>
        </nav>
      </section>
    </div>
  );
}
