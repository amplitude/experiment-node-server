import { Variants } from '@amplitude/experiment-js-client';
import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useContext } from 'react';

import { ExperimentContext } from '../../../contexts/experimentContext';
import styles from '../../../styles/Home.module.css';

export const Control: NextPage = () => {
  const experiment = useContext(ExperimentContext);
  const feature = experiment.variant('js-ssr-demo');
  return (
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
      <footer className={styles.footer}>
        <img
          src="/amplitude-logo.svg"
          alt="Flag enabled!"
          className={styles.logo}
        />
      </footer>
    </div>
  );
};

export const getStaticProps: GetStaticProps<{
  features: Variants;
}> = async () => ({
  props: {
    features: {
      'js-ssr-demo': {
        value: 'false',
        payload: { testKey: 'abc' },
      },
    },
  },
});

export default Control;
