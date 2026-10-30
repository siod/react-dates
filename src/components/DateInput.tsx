import React from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import noop from '../utils/noop.js';
import { noflip, withStyles } from '../internal/styles/index.js';
import type { WithStylesProps } from '../internal/styles/withStyles.js';
import { isTouchDevice, throttle } from '../internal/browser/index.js';
import type { ThrottledFunction } from '../internal/browser/throttle.js';
import type { OpenDirection } from '../types.js';

import getInputHeight from '../utils/getInputHeight.js';

import {
  OPEN_DOWN,
  OPEN_UP,
  FANG_HEIGHT_PX,
  FANG_WIDTH_PX,
  DEFAULT_VERTICAL_SPACING,
  MODIFIER_KEY_NAMES,
} from '../constants.js';

const FANG_PATH_TOP = `M0,${FANG_HEIGHT_PX} ${FANG_WIDTH_PX},${FANG_HEIGHT_PX} ${FANG_WIDTH_PX / 2},0z`;
const FANG_STROKE_TOP = `M0,${FANG_HEIGHT_PX} ${FANG_WIDTH_PX / 2},0 ${FANG_WIDTH_PX},${FANG_HEIGHT_PX}`;
const FANG_PATH_BOTTOM = `M0,0 ${FANG_WIDTH_PX},0 ${FANG_WIDTH_PX / 2},${FANG_HEIGHT_PX}z`;
const FANG_STROKE_BOTTOM = `M0,0 ${FANG_WIDTH_PX / 2},${FANG_HEIGHT_PX} ${FANG_WIDTH_PX},0`;

type DateInputKeyEvent = ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>;

export interface DateInputProps {
  id: string;
  placeholder?: string;
  displayValue?: string;
  ariaLabel?: string;
  autoComplete?: string;
  titleText?: string;
  screenReaderMessage?: string;
  focused?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean | null;
  openDirection?: OpenDirection;
  showCaret?: boolean;
  verticalSpacing?: number;
  small?: boolean;
  block?: boolean;
  regular?: boolean;
  onChange?: (value: string) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onKeyDownShiftTab?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownTab?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownArrowDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMark?: (event: DateInputKeyEvent) => void;
  isFocused?: boolean;
}

const defaultProps = {
  placeholder: 'Select Date',
  displayValue: '',
  ariaLabel: undefined,
  autoComplete: 'off',
  titleText: undefined,
  screenReaderMessage: '',
  focused: false,
  disabled: false,
  required: false,
  readOnly: null,
  openDirection: OPEN_DOWN,
  showCaret: false,
  verticalSpacing: DEFAULT_VERTICAL_SPACING,
  small: false,
  block: false,
  regular: false,

  onChange: noop,
  onFocus: noop,
  onKeyDownShiftTab: noop,
  onKeyDownTab: noop,

  onKeyDownArrowDown: noop,
  onKeyDownQuestionMark: noop,

  // accessibility
  isFocused: false,
} satisfies Omit<DateInputProps, 'id'>;

type DateInputInternalProps = DateInputProps & WithStylesProps;

interface DateInputState {
  dateString: string;
  isTouchDevice: boolean;
}

class DateInput extends React.PureComponent<DateInputInternalProps, DateInputState> {
  static defaultProps = defaultProps;

  private inputRef: HTMLInputElement | null = null;

  private readonly throttledKeyDown: ThrottledFunction<[KeyboardEvent<HTMLInputElement>], void>;

  constructor(props: DateInputInternalProps) {
    super(props);

    this.state = {
      dateString: '',
      isTouchDevice: false,
    };

    this.throttledKeyDown = throttle(this.onFinalKeyDown, 300, { trailing: false });
  }

  override componentDidMount() {
    this.setState({ isTouchDevice: isTouchDevice() });
  }

  override componentDidUpdate(prevProps: DateInputInternalProps) {
    const { displayValue, focused, isFocused } = this.props;
    const { dateString } = this.state;

    if (prevProps.displayValue !== displayValue && dateString) {
      this.setState({ dateString: '' });
      return;
    }

    if (prevProps.focused === focused && prevProps.isFocused === isFocused) return;

    if (focused && isFocused) {
      this.inputRef?.focus();
    }
  }

  override componentWillUnmount() {
    this.throttledKeyDown.cancel();
  }

  onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const onChange = this.props.onChange ?? defaultProps.onChange;
    const onKeyDownQuestionMark = this.props.onKeyDownQuestionMark
      ?? defaultProps.onKeyDownQuestionMark;
    const dateString = e.target.value;

    // In Safari, onKeyDown does not consistently fire ahead of onChange. As a result, we need to
    // special case the `?` key so that it always triggers the appropriate callback, instead of
    // modifying the input value
    if (dateString[dateString.length - 1] === '?') {
      onKeyDownQuestionMark(e);
    } else {
      this.setState({ dateString }, () => onChange(dateString));
    }
  };

  onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!MODIFIER_KEY_NAMES.has(e.key)) {
      this.throttledKeyDown(e);
    }
  };

  onFinalKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const {
      onKeyDownShiftTab = defaultProps.onKeyDownShiftTab,
      onKeyDownTab = defaultProps.onKeyDownTab,
      onKeyDownArrowDown = defaultProps.onKeyDownArrowDown,
      onKeyDownQuestionMark = defaultProps.onKeyDownQuestionMark,
    } = this.props;
    const { key } = e;

    if (key === 'Tab') {
      if (e.shiftKey) {
        onKeyDownShiftTab(e);
      } else {
        onKeyDownTab(e);
      }
    } else if (key === 'ArrowDown') {
      onKeyDownArrowDown(e);
    } else if (key === '?') {
      e.preventDefault();
      onKeyDownQuestionMark(e);
    }
  };

  setInputRef = (ref: HTMLInputElement | null) => {
    this.inputRef = ref;
  };

  override render() {
    const {
      dateString,
      isTouchDevice: isTouch,
    } = this.state;
    const {
      id,
      placeholder = defaultProps.placeholder,
      ariaLabel = defaultProps.ariaLabel,
      autoComplete = defaultProps.autoComplete,
      titleText = defaultProps.titleText,
      displayValue = defaultProps.displayValue,
      screenReaderMessage = defaultProps.screenReaderMessage,
      focused = defaultProps.focused,
      showCaret = defaultProps.showCaret,
      onFocus = defaultProps.onFocus,
      disabled = defaultProps.disabled,
      required = defaultProps.required,
      readOnly = defaultProps.readOnly,
      openDirection = defaultProps.openDirection,
      verticalSpacing = defaultProps.verticalSpacing,
      small = defaultProps.small,
      regular = defaultProps.regular,
      block = defaultProps.block,
      css,
      styles,
      theme: { reactDates },
    } = this.props;

    const value = dateString || displayValue || '';
    const screenReaderMessageId = `DateInput__screen-reader-message-${id}`;

    const withFang = showCaret && focused;

    const inputHeight = getInputHeight(reactDates, small);

    return (
      <div
        {...css(
          styles.DateInput,
          small && styles.DateInput__small,
          block && styles.DateInput__block,
          withFang && styles.DateInput__withFang,
          disabled && styles.DateInput__disabled,
          withFang && openDirection === OPEN_DOWN && styles.DateInput__openDown,
          withFang && openDirection === OPEN_UP && styles.DateInput__openUp,
        )}
      >
        <input
          {...css(
            styles.DateInput_input,
            small && styles.DateInput_input__small,
            regular && styles.DateInput_input__regular,
            readOnly && styles.DateInput_input__readOnly,
            focused && styles.DateInput_input__focused,
            disabled && styles.DateInput_input__disabled,
          )}
          aria-label={ariaLabel === undefined ? placeholder : ariaLabel}
          title={titleText}
          type="text"
          id={id}
          name={id}
          ref={this.setInputRef}
          value={value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          readOnly={typeof readOnly === 'boolean' ? readOnly : isTouch}
          required={required}
          aria-describedby={screenReaderMessage && screenReaderMessageId}
        />

        {withFang && (
          <svg
            role="presentation"
            focusable="false"
            {...css(
              styles.DateInput_fang,
              openDirection === OPEN_DOWN && {
                top: inputHeight + verticalSpacing - FANG_HEIGHT_PX,
              },
              openDirection === OPEN_UP && {
                bottom: inputHeight + verticalSpacing - FANG_HEIGHT_PX,
              },
            )}
          >
            <path
              {...css(styles.DateInput_fangShape)}
              d={openDirection === OPEN_DOWN ? FANG_PATH_TOP : FANG_PATH_BOTTOM}
            />
            <path
              {...css(styles.DateInput_fangStroke)}
              d={openDirection === OPEN_DOWN ? FANG_STROKE_TOP : FANG_STROKE_BOTTOM}
            />
          </svg>
        )}

        {screenReaderMessage && (
          <p {...css(styles.DateInput_screenReaderMessage)} id={screenReaderMessageId}>
            {screenReaderMessage}
          </p>
        )}
      </div>
    );
  }
}

export default withStyles(({
  reactDates: {
    border, color, sizing, spacing, font, zIndex,
  },
}) => ({
  DateInput: {
    margin: 0,
    padding: spacing.inputPadding,
    background: color.background,
    position: 'relative',
    display: 'inline-block',
    width: sizing.inputWidth,
    verticalAlign: 'middle',
  },

  DateInput__small: {
    width: sizing.inputWidth_small,
  },

  DateInput__block: {
    width: '100%',
  },

  DateInput__disabled: {
    background: color.disabled,
    color: color.textDisabled,
  },

  DateInput_input: {
    boxSizing: 'border-box',
    fontWeight: font.input.weight,
    fontSize: font.input.size,
    lineHeight: font.input.lineHeight,
    color: color.text,
    backgroundColor: color.background,
    width: '100%',
    padding: `${spacing.displayTextPaddingVertical}px ${spacing.displayTextPaddingHorizontal}px`,
    paddingTop: spacing.displayTextPaddingTop,
    paddingBottom: spacing.displayTextPaddingBottom,
    paddingLeft: noflip(spacing.displayTextPaddingLeft),
    paddingRight: noflip(spacing.displayTextPaddingRight),
    border: border.input.border,
    borderTop: border.input.borderTop,
    borderRight: noflip(border.input.borderRight),
    borderBottom: border.input.borderBottom,
    borderLeft: noflip(border.input.borderLeft),
    borderRadius: border.input.borderRadius,
  },

  DateInput_input__small: {
    fontSize: font.input.size_small,
    lineHeight: font.input.lineHeight_small,
    letterSpacing: font.input.letterSpacing_small,
    padding: `${spacing.displayTextPaddingVertical_small}px ${spacing.displayTextPaddingHorizontal_small}px`,
    paddingTop: spacing.displayTextPaddingTop_small,
    paddingBottom: spacing.displayTextPaddingBottom_small,
    paddingLeft: noflip(spacing.displayTextPaddingLeft_small),
    paddingRight: noflip(spacing.displayTextPaddingRight_small),
  },

  DateInput_input__regular: {
    fontWeight: 'inherit',
  },

  DateInput_input__readOnly: {
    userSelect: 'none',
  },

  DateInput_input__focused: {
    outline: border.input.outlineFocused,
    background: color.backgroundFocused,
    border: border.input.borderFocused,
    borderTop: border.input.borderTopFocused,
    borderRight: noflip(border.input.borderRightFocused),
    borderBottom: border.input.borderBottomFocused,
    borderLeft: noflip(border.input.borderLeftFocused),
  },

  DateInput_input__disabled: {
    background: color.disabled,
    fontStyle: font.input.styleDisabled,
  },

  DateInput_screenReaderMessage: {
    border: 0,
    clip: 'rect(0, 0, 0, 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    width: 1,
  },

  DateInput_fang: {
    position: 'absolute',
    width: FANG_WIDTH_PX,
    height: FANG_HEIGHT_PX,
    left: 22, // TODO: should be noflip wrapped and handled by an isRTL prop
    zIndex: zIndex + 2,
  },

  DateInput_fangShape: {
    fill: color.background,
  },

  DateInput_fangStroke: {
    stroke: color.core.border,
    fill: 'transparent',
  },
}), { pureComponent: typeof React.PureComponent !== 'undefined' })(DateInput);
