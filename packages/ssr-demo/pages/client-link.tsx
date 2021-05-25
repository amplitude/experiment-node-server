import Head from 'next/head';
import Link from 'next/link';
import { ReactNode, useContext } from 'react';

import { SkylabContext } from '../contexts/skylabContext';
import styles from '../styles/Home.module.css';

const Home = (): ReactNode => {
  const skylab = useContext(SkylabContext);
  const feature = skylab.getVariant('js-ssr-demo');
  return (
    <div className={styles.container}>
      <Head>
        <title>SSR Demo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          SSR client side navigation demo for Skylab
        </h1>
        <Link href="/">Back to index</Link>
        <p className={styles.description}>
          If you see an image below, the feature flag is enabled
        </p>
        <p>{`js-ssr-demo: ${feature?.value}`}</p>
        <p>{`payload: ${JSON.stringify(feature?.payload)}`}</p>
      </main>

      {feature?.value ? (
        <footer className={styles.footer}>
          <img
            src="/amplitude-logo.svg"
            alt="Flag enabled!"
            className={styles.logo}
          />
        </footer>
      ) : null}
    </div>
  );
};

export default Home;
