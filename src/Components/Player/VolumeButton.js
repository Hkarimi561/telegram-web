/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import VolumeMuteIcon from '@material-ui/icons/VolumeMute';
import VolumeDownIcon from '@material-ui/icons/VolumeDown';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/lab/Slider';
import { borderStyle } from '../Theme';
import { PLAYER_VOLUME_NORMAL } from '../../Constants';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import './VolumeButton.css';

const styles = theme => ({
    iconButton: {
        padding: 4
    },
    root: {
        display: 'flex',
        height: 100,
        width: 28,
        padding: '13px 0',
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
    },
    slider: {
        padding: '0 13px'
    },
    thumb: {
        opacity: 0
    },
    ...borderStyle(theme)
});

class VolumeButton extends React.Component {
    state = {
        anchorEl: null,
        value: PlayerStore.volume,
        prevValue: PlayerStore.volume,
        dragging: false,
        buttonOver: false,
        popupOver: false
    };

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaVolume', this.onClientUpdateMediaVolume);
    }

    componentWillUnmount() {
        PlayerStore.removeListener('clientUpdateMediaVolume', this.onClientUpdateMediaVolume);
    }

    onClientUpdateMediaVolume = update => {
        const { volume, prevVolume } = update;

        if (prevVolume === undefined) {
            this.setState({ value: volume });
        } else {
            this.setState({ value: volume, prevValue: prevVolume });
        }
    };

    handlePopoverOpen = anchorEl => {
        this.setState({ anchorEl: anchorEl });
    };

    handlePopoverClose = () => {
        const { dragging, buttonOver, popupOver } = this.state;

        if (dragging) return;
        if (buttonOver) return;
        if (popupOver) return;

        this.setState({ anchorEl: null });
    };

    handleMouseEnter = (event, openPopover) => {
        this.setState({ buttonOver: true });

        if (openPopover) {
            this.handlePopoverOpen(event.currentTarget);
        }
    };

    handleMouseLeave = () => {
        this.setState({ buttonOver: false }, () => {
            this.handlePopoverClose();
        });
    };

    handlePopupMouseLeave = () => {
        this.setState({ popupOver: false }, () => {
            this.handlePopoverClose();
        });
    };

    handleVoiceClick = () => {
        const { value, prevValue } = this.state;
        const nextValue = value > 0 ? 0 : prevValue || PLAYER_VOLUME_NORMAL;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaVolume',
            volume: nextValue
        });
    };

    handleChange = (event, value) => {
        const { dragging, prevValue } = this.state;

        if (dragging) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaVolume',
                volume: value
            });
        } else {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaVolume',
                prevVolume: value > 0 ? value : prevValue,
                volume: value
            });
        }
    };

    handleDragStart = () => {
        const { value } = this.state;

        this.setState({
            dragging: true,
            prevValue: value
        });
    };

    handleDragEnd = () => {
        const { value, prevValue } = this.state;

        this.setState(
            {
                dragging: false,
                prevValue: value > 0 ? value : prevValue
            },
            () => {
                this.handlePopoverClose();
            }
        );
    };

    getVolumeIcon = value => {
        if (value === 0) {
            return <VolumeOffIcon fontSize='small' />;
        }

        if (value < 0.25) {
            return <VolumeMuteIcon fontSize='small' />;
        }

        if (value < 0.5) {
            return <VolumeDownIcon fontSize='small' />;
        }

        return <VolumeUpIcon fontSize='small' />;
    };

    render() {
        const { classes } = this.props;
        const { anchorEl, value } = this.state;
        const open = Boolean(anchorEl);

        return (
            <div
                onMouseEnter={e => this.handleMouseEnter(e, true)}
                onMouseLeave={this.handleMouseLeave}
                style={{
                    position: 'relative',
                    background: 'transparent'
                }}>
                <IconButton className={classes.iconButton} color='primary' onClick={this.handleVoiceClick}>
                    {this.getVolumeIcon(value)}
                </IconButton>
                <div
                    style={{
                        position: 'absolute',
                        background: 'transparent',
                        visibility: open ? 'visible' : 'hidden',
                        zIndex: 1
                    }}
                    onMouseEnter={e => this.handleMouseEnter(e, false)}
                    onMouseLeave={this.handlePopupMouseLeave}>
                    <div
                        className={classNames(classes.borderColor, classes.root)}
                        style={{
                            marginTop: 8,
                            borderWidth: 1,
                            borderStyle: 'solid'
                        }}>
                        <Slider
                            classes={{ container: classes.slider, thumb: classes.thumb }}
                            min={0}
                            max={1}
                            value={value}
                            onChange={this.handleChange}
                            onDragStart={this.handleDragStart}
                            onDragEnd={this.handleDragEnd}
                            vertical
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(VolumeButton);
