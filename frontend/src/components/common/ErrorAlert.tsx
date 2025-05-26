import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  return (
    <Box my={2}>
      <Alert 
        severity="error" 
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<Refresh />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      >
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    </Box>
  );
}