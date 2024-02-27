import Head from 'next/head';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';

import styles from '../styles/Home.module.css';

import { getServerSideProps, initializeExperimentClient } from './utils';

const Home = ({ variants }): ReactNode => {
  const CLIENT_DEPLOYMENT_KEY = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const experiment = initializeExperimentClient(
    CLIENT_DEPLOYMENT_KEY,
    variants,
  );
  const feature = experiment.variant('sdk-ci-test-local');
  return isClient ? (
    <div className={styles.container}>
      <Head>
        <title>SSR Demo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>SSR demo for Experiment</h1>

        <Link href="/client-link">Client side navigation demo</Link>
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
  ) : null;
};

export { getServerSideProps };

export default Home;
