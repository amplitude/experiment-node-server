import Head from 'next/head';
import Link from 'next/link';
import { ReactNode, useContext, useEffect } from 'react';

import { ExperimentContext } from '../contexts/experimentContext';
import styles from '../styles/Home.module.css';

const Home = (): ReactNode => {
  const flagKey = 'edge-local-evaluation';
  const experiment = useContext(ExperimentContext);
  const feature = experiment.variant(flagKey);
  useEffect(() => {
    experiment.fetch();
  });
  return (
    <div className={styles.container}>
      <Head>
        <title>SSR Local Evaluation Demo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>SSR demo for Experiment</h1>

        <Link href="/client-link">Client side navigation demo</Link>
        <p className={styles.description}>
          If you see an image below, the feature flag is enabled
        </p>
        <p>{`${flagKey}: ${feature?.value}`}</p>
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
