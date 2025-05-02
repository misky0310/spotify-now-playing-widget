import { run, styled } from "uebersicht";

const refreshFrequency = 500;
const size = 80;
const Sep = "⎖"; // Ideally, this is never a character in a song title!

const initialState = { 
  loading: true, 
  size: 35,
  appAvailable: false
};

const command = async (dispatch) => {
  refresh(dispatch);
};

const getTrackProperties = () =>
  run(
    `osascript <<'END'
    set output to ""
    if application "Spotify" is running then
      tell application "Spotify"
        set output to player state & "${Sep}" & current track's name & "${Sep}" & current track's artist & "${Sep}" & current track's album & "${Sep}" & current track's artwork url & "${Sep}" & current track's duration & "${Sep}" & player position
      end tell
    end if
  `
  );

const waitAndRefresh = async (dispatch) => {
  setTimeout(() => refresh(dispatch), 50);
};

const refresh = async (dispatch) => {
  const props = await getTrackProperties();
  if (props == "") {
    dispatch({
      dispatch,
      type: "SONG_DATA",
      data: { appAvailable: false },
    });
    return;
  }
  const [playing, song, artist, album, cover, duration, position] = props
    .slice(0, -1)
    .split(`, ${Sep}, `); // This is weird Applescript behavior new to macOS 10.15.4
  dispatch({
    dispatch,
    type: "SONG_DATA",
    data: {
      dispatch,
      playing: playing == "playing",
      position: Number(position / (duration / 1000)),
      song,
      artist,
      album,
      cover,
      appAvailable: true,
    },
  });
};

const commandSpotify = async (verb, dispatch) => {
  await run(
    `osascript <<'END'
    if application "Spotify" is running then
      tell application "Spotify"
        ${verb}
      end tell
    end if
  `
  );
  waitAndRefresh(dispatch);
};

// Updated Container with higher opacity and fixed position
const Container = styled("div")`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.125); 
  border-radius: 12px;
  padding: 10px 15px;
  min-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: opacity 0.5s linear;
  z-index: 9999;
`;

const Song = styled("h1")`
  font-size: 13px;
  margin: 0 0;
`;

const Artist = styled("h2")`
  font-size: 11px;
  font-weight: normal;
  margin: 0 0;
`;

const Cover = styled("img")`
  border-radius: 8px;
  height: ${size}px;
  width: ${size}px;
  margin-right: ${size * 0.2}px;
`;

const Button = styled("div")`
  display: inline-block;
  padding: 4px 6px;

  &:hover svg {
    color: #ccc;
  }

  &:active svg {
    transform: scale(0.95) translateY(1px);
  }
`;

const Separator = styled("div")`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0;
  height: 1px;
  flex: 1;
  margin: 4px 0;
  position: relative;
  max-width: 12em;

  box-shadow: 0px 1px 4px #000000;

  &::after {
    content: "";
    display: block;
    transition: width 1s ease-in-out;
    border-top: solid 1px rgba(255, 255, 255, 0.5);
    width: ${(props) => (props.position ? props.position * 96 + 4 : 100)}%;
  }
`;

const FFButton = ({ backwards, dispatch }) => {
  return (
    <Button
      onClick={(_) =>
        commandSpotify(backwards ? "previous track" : "next track", dispatch)
      }
    >
      <svg
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: backwards ? "" : "scaleX(-1)" }}
      >
        <path d="M6.10849 1.43426C6.10849 1.07081 5.58133 0.868751 5.22546 1.0958L1.20398 3.66153C0.932007 3.83505 0.932007 4.16495 1.20398 4.33847L5.22546 6.9042C5.58133 7.13125 6.10849 6.92919 6.10849 6.56574V1.43426Z" />
        <path d="M11 1.43426C11 1.07081 10.4728 0.868751 10.117 1.0958L6.09549 3.66153C5.82352 3.83505 5.82352 4.16495 6.09549 4.33847L10.117 6.9042C10.4728 7.13125 11 6.92919 11 6.56574V1.43426Z" />
      </svg>
    </Button>
  );
};

const PlayPauseButton = ({ playing, dispatch }) => {
  return (
    <Button
      onClick={() => commandSpotify(playing ? "pause" : "play", dispatch)}
    >
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {playing ? (
          <g>
            <rect width="3" height="8" rx="0.6" />
            <rect x="5" width="3" height="8" rx="0.6" />
          </g>
        ) : (
          <path d="M1 0.689272V7.31073C1 7.61786 1.33179 7.8104 1.59846 7.65803L7.39223 4.3473C7.66096 4.19374 7.66096 3.80626 7.39223 3.6527L1.59846 0.341974C1.33179 0.189596 1 0.382143 1 0.689272Z" />
        )}
      </svg>
    </Button>
  );
};

const updateState = (event, previousState) => {
  if (event.type == "SONG_DATA") {
    return {
      ...previousState,
      ...event.data,
      dispatch: event.dispatch,
      loading: false,
    };
  } else return previousState;
};

const render = (data) => {
  if (data.error || data.loading) return <div></div>;
  const { song, artist, album, cover, playing, position, appAvailable } = data;
  
  return (
    <Container style={{ opacity: !appAvailable ? 0 : playing ? 1 : 0.3 }}>
      <Cover src={cover} size={size} />
      <div>
        <Song>{song}</Song>
        <Separator position={position} />
        <Artist>
          {artist}
          {artist && album ? " – " : ""}
          <em>{album}</em>
        </Artist>
        <div style={{ marginLeft: -4 }}>
          <FFButton backwards dispatch={data.dispatch} />
          <PlayPauseButton playing={playing} dispatch={data.dispatch} />
          <FFButton dispatch={data.dispatch} />
        </div>
      </div>
    </Container>
  );
};

// Update to fixed bottom left position
const className = `
  cursor: default;
  user-select: none;
  font-family: -apple-system, sans-serif;
  text-shadow: 0px 1px 4px #000000;
  color: #fff;
  bottom: 10px;
  left: 10px;
  max-width: 20em;
  fill: #fff;
  position: fixed;
`;

export {
  refreshFrequency,
  command,
  initialState,
  updateState,
  className,
  render,
};

/*
  Applescript reference for Spotify's "track" entry:

  artist
  album
  disc number
  duration
  played count
  track number
  popularity
  id
  name
  artist
  artwork url
  spotify url
*/