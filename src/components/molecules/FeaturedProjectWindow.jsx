import banner from '../../assets/design/hoshi-store-banner.webp';
import WindowChrome from '../atoms/WindowChrome';
import ActionLink from '../atoms/ActionLink';

export default function FeaturedProjectWindow({ language }) {
  return <article className="featured-project-window">
    <WindowChrome filename="HOSHI_STAR_SUDOKU.APP" />
    <img className="featured-project-window__banner" src={banner} alt="Hoshi: Sudoku in a New Shape" width="2048" height="1000" loading="lazy" decoding="async" />
    <div className="featured-project-window__copy">
      <h3>HOSHI: STAR SUDOKU</h3>
      <div className="featured-project-window__details">
        <p>{language === 'de' ? <>Sudoku neu gedacht. Löse Zahlenrätsel auf einem außergewöhnlichen, sternförmigen Spielfeld.<br />Auch ohne WLAN spielbar.</> : <>A fresh take on the classic Sudoku puzzle. Solve number puzzles on a distinctive star-shaped board.<br />No Wi-Fi needed to play.</>}</p>
        <ActionLink to={`/${language}/games/hoshi`}>{language === 'de' ? 'HOSHI ENTDECKEN' : 'DISCOVER HOSHI'}</ActionLink>
      </div>
    </div>
  </article>;
}
