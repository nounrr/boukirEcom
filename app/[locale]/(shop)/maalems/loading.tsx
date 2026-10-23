import styles from '@/components/maalems/directory.module.css'

export default function MaalemsLoading() {
  return <div className={styles.page} aria-busy="true">
    <div className={styles.container} aria-hidden="true">
      <div className={styles.hero}>
        <div><div className={`${styles.skeleton} ${styles.skeletonLine}`} /><div className={`${styles.skeleton} ${styles.skeletonTitle}`} /><div className={`${styles.skeleton} ${styles.skeletonTitle}`} /><div className={`${styles.skeleton} ${styles.skeletonLine}`} /><div className={`${styles.skeleton} ${styles.skeletonLine}`} /></div>
        <div className={`${styles.heroFigure} ${styles.skeleton}`} />
      </div>
      <div className={`${styles.searchPanel} ${styles.skeletonSearch}`} />
      <div className={styles.results}><div className={`${styles.skeleton} ${styles.skeletonLine}`} /><div className={styles.directoryGrid}>{Array.from({ length: 6 }, (_, index) => <div key={index} className={styles.card}><div className={`${styles.skeleton} ${styles.skeletonMedia}`} /><div className={`${styles.skeleton} ${styles.skeletonLine}`} /><div className={`${styles.skeleton} ${styles.skeletonLine}`} /></div>)}</div></div>
    </div>
  </div>
}
