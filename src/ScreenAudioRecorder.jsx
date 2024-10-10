import React, { useState, useRef } from 'react';
import { useTimer } from 'react-timer-hook';
import { Button, Box, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';

const ScreenAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const combinedStreamRef = useRef(null);

  const { seconds, minutes, hours, start, pause, reset } = useTimer({ expiryTimestamp: 0, onExpire: () => console.warn('Timer expired') });

  // Open permission popup
  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  // Close permission popup
  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleStartRecording = async () => {
    try {
      // Request screen stream
      screenStreamRef.current = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false,
      });

      // Request microphone audio
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Combine streams
      combinedStreamRef.current = new MediaStream([
        ...screenStreamRef.current.getVideoTracks(),
        ...audioStreamRef.current.getAudioTracks(),
      ]);

      // Initialize MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(combinedStreamRef.current, {
        mimeType: 'video/webm; codecs=vp8,opus',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${recordingName || 'screen-audio-recording'}.webm`; 
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        recordedChunksRef.current = [];
      };

     
      mediaRecorderRef.current.start();
      start(); 
      setIsRecording(true);
      setIsStopped(false);
      setIsPopupOpen(false); 
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please ensure you have granted the necessary permissions.');
    }
  };

  const handlePauseRecording = () => {
    mediaRecorderRef.current.pause();
    setIsPaused(true);
    pause(); 
  };

  const handleResumeRecording = () => {
    mediaRecorderRef.current.resume();
    setIsPaused(false);
    start(); 
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current.stop();
    screenStreamRef.current.getTracks().forEach((track) => track.stop());
    audioStreamRef.current.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setIsStopped(true);
    reset(); 
  };

  const handleMute = () => {
    audioStreamRef.current.getAudioTracks()[0].enabled = false;
    setIsMuted(true);
  };

  const handleUnmute = () => {
    audioStreamRef.current.getAudioTracks()[0].enabled = true;
    setIsMuted(false);
  };

  return (
    <Box sx={{ textAlign: 'center', margin: '50px', backgroundColor: '#f4f4f4', padding: '20px', borderRadius: '10px' }}>
      <Typography variant="h4" gutterBottom>
        Screen and Audio Recorder
      </Typography>

      <Box sx={{ my: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleOpenPopup} 
          disabled={isRecording}
          sx={{ mx: 1 }}
        >
          Start Recording
        </Button>

        <Button
          variant="contained"
          color="warning"
          onClick={handlePauseRecording}
          disabled={!isRecording || isPaused}
          sx={{ mx: 1 }}
        >
          Pause Recording
        </Button>

        <Button
          variant="contained"
          color="info"
          onClick={handleResumeRecording}
          disabled={!isPaused}
          sx={{ mx: 1 }}
        >
          Resume Recording
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleStopRecording}
          disabled={isStopped}
          sx={{ mx: 1 }}
        >
          Stop Recording
        </Button>
      </Box>

      <Box sx={{ my: 2 }}>
        <Button
          variant="contained"
          color="warning"
          onClick={handleMute}
          disabled={isMuted || !isRecording}
          sx={{ mx: 1 }}
        >
          Mute Microphone
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={handleUnmute}
          disabled={!isMuted || !isRecording}
          sx={{ mx: 1 }}
        >
          Unmute Microphone
        </Button>
      </Box>

      <Typography variant="h5" sx={{ mt: 3 }}>
        {`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </Typography>

      <Dialog open={isPopupOpen} onClose={handleClosePopup}>
        <DialogTitle>Recording Permission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a name for your recording and grant permission to start the screen and audio recording.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Recording Name"
            fullWidth
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePopup} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleStartRecording} color="primary">
            Allow and Start Recording
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScreenAudioRecorder;
