import { run, styled } from "uebersicht";

const refreshFrequency = 500;
const size = 85;
const Sep = "⎖"; // Ideally, this is never a character in a song title!

const initialState = { 
  loading: true, 
  size: 35,
  appAvailable: false,
  isDragging: false,
  tempPosition: 0
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
      rawPosition: Number(position),
      rawDuration: Number(duration / 1000),
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

// Function to set the position in the track
const setTrackPosition = async (position, dispatch) => {
  await run(
    `osascript <<'END'
    if application "Spotify" is running then
      tell application "Spotify"
        set player position to ${position}
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
  border: 1px solid rgba(0, 0, 0, 0.15);
  transition: opacity 0.5s linear;
  z-index: 9999;
`;

const Song = styled("h1")`
  font-size: 13px;
  margin: 0 0;
`;

const Artist = styled("h2")`
  font-size: 12px;
  font-weight: normal;
  margin-top:6px;
  margin-bottom:0;
`;

const Cover = styled("img")`
  border-radius: 8px;
  height: ${size}px;
  width: ${size}px;
  margin-right: ${size * 0.15}px;
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

const SliderContainer = styled("div")`
  position: relative;
  width: 100%;
  margin: 4px 0;
  height: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const SliderTrack = styled("div")`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  height: 4px;
  flex: 1;
  position: relative;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
`;

const SliderProgress = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  transition: ${props => props.isDragging ? 'none' : 'width 0.3s linear'};
  width: ${props => props.position * 100}%;
`;

const SliderThumb = styled("div")`
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  top: 50%;
  left: ${props => props.position * 100}%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  transition: ${props => props.isDragging ? 'none' : 'left 0.3s linear'};
  opacity: ${props => props.isDragging || props.hover ? 1 : 0.7};
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }
`;

const TimeDisplay = styled("div")`
  font-size: 9px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
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

// Format time as mm:ss
const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
};

const updateState = (event, previousState) => {
  if (event.type == "SONG_DATA") {
    // Only update position if not currently dragging
    if (!previousState.isDragging) {
      return {
        ...previousState,
        ...event.data,
        dispatch: event.dispatch,
        loading: false,
      };
    } else {
      // Keep the user's dragging position
      return {
        ...previousState,
        ...event.data,
        position: previousState.tempPosition,
        dispatch: event.dispatch,
        loading: false,
      };
    }
  } else if (event.type == "DRAG_START") {
    return {
      ...previousState,
      isDragging: true
    };
  } else if (event.type == "DRAG_MOVE") {
    return {
      ...previousState,
      tempPosition: event.position,
      position: event.position
    };
  } else if (event.type == "DRAG_END") {
    // Calculate the actual time to set
    const newPosition = previousState.rawDuration * event.position;
    
    // Set the position in Spotify
    setTrackPosition(newPosition, previousState.dispatch);
    
    return {
      ...previousState,
      isDragging: false,
      position: event.position
    };
  }
  
  return previousState;
};

const render = (data) => {
  if (data.error || data.loading) return <div></div>;
  const { song, artist, album, cover, playing, position, appAvailable, isDragging, rawPosition, rawDuration } = data;
  
  // Handler for slider interaction
  const handleSliderInteraction = (e) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    let newPosition = offsetX / width;
    
    // Clamp between 0 and 1
    newPosition = Math.max(0, Math.min(1, newPosition));
    
    if (e.type === 'mousedown') {
      // Start dragging
      data.dispatch({
        type: "DRAG_START"
      });
      
      // Add listeners for drag and end events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Update position
      data.dispatch({
        type: "DRAG_MOVE",
        position: newPosition
      });
    }
    
    function handleMouseMove(e) {
      const offsetX = e.clientX - rect.left;
      let newPosition = offsetX / width;
      newPosition = Math.max(0, Math.min(1, newPosition));
      
      data.dispatch({
        type: "DRAG_MOVE",
        position: newPosition
      });
    }
    
    function handleMouseUp(e) {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const offsetX = e.clientX - rect.left;
      let finalPosition = offsetX / width;
      finalPosition = Math.max(0, Math.min(1, finalPosition));
      
      data.dispatch({
        type: "DRAG_END",
        position: finalPosition
      });
    }
  };
  
  return (
    <Container style={{ opacity: !appAvailable ? 0 : playing ? 1 : 0.3 }}>
      <Cover src={cover} size={size} />
      <div style={{ width: "100%" }}>
        <Song>{song}</Song>
        
        {/* New slider component */}
        <SliderContainer onMouseDown={handleSliderInteraction}>
          <SliderTrack>
            <SliderProgress position={position} isDragging={isDragging} />
          </SliderTrack>
          <SliderThumb position={position} isDragging={isDragging} />
        </SliderContainer>
        
        {/* Time display */}
        <TimeDisplay>
          <span>{formatTime(rawPosition)}</span>
          <span>{formatTime(rawDuration)}</span>
        </TimeDisplay>
        
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
  bottom: 20px;
  left: 20px;
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