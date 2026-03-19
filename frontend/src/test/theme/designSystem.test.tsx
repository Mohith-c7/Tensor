import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Snackbar from '@mui/material/Snackbar';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { theme } from '../../theme';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CssVarsProvider theme={theme}>{children}</CssVarsProvider>
);

describe('Design System — Button variants', () => {
  it('renders contained button', () => {
    const { container } = render(<Button variant="contained">Click</Button>, { wrapper: Wrapper });
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders outlined button', () => {
    const { container } = render(<Button variant="outlined">Click</Button>, { wrapper: Wrapper });
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders text button', () => {
    const { container } = render(<Button variant="text">Click</Button>, { wrapper: Wrapper });
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Design System — TextField variants', () => {
  it('renders outlined TextField', () => {
    const { container } = render(<TextField label="Name" variant="outlined" />, { wrapper: Wrapper });
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders filled TextField', () => {
    const { container } = render(<TextField label="Name" variant="filled" />, { wrapper: Wrapper });
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Design System — Card', () => {
  it('renders Card', () => {
    const { container } = render(
      <Card><CardContent>Content</CardContent></Card>,
      { wrapper: Wrapper }
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Design System — Dialog', () => {
  it('renders open Dialog', () => {
    const { container } = render(
      <Dialog open><DialogContent>Content</DialogContent></Dialog>,
      { wrapper: Wrapper }
    );
    expect(container).toMatchSnapshot();
  });
});

describe('Design System — Snackbar', () => {
  it('renders open Snackbar', () => {
    const { container } = render(
      <Snackbar open message="Hello" />,
      { wrapper: Wrapper }
    );
    expect(container).toMatchSnapshot();
  });
});
