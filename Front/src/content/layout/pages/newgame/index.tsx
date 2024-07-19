import { useMemo, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import './newgame.css';
import { useDispatch } from 'react-redux';
import { sagaActions } from '/redux/saga';
import { useNavigate } from 'react-router-dom';

function Newgame() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [players, setPlayers] = useState([
        'human',
        'robot2',
        'robot',
        'robot2',
    ]);

    const [randNumber, setRandNumber] = useState(() =>
        crypto.getRandomValues(new Uint32Array(1)),
    );

    const getUrlByPlayer = (play: string) => {
        if (play === 'human') return '/pictures/human.png';
        else if (play === 'robot') return '/pictures/robot.png';
        return '/pictures/robot2.png';
    };

    const changePlayer = (pos: number) => {
        const clone = [...players];
        if (clone[pos] === 'human') clone[pos] = 'robot';
        else if (clone[pos] === 'robot') clone[pos] = 'robot2';
        else clone[pos] = 'human';
        setPlayers(clone);
    };

    const newStart = (event: React.FormEvent) => {
        event.preventDefault();
        console.log('values', players, randNumber);
        navigate('/');
        dispatch({
            type: sagaActions.GAME_START,
            payload: {
                gameName: 'afc9847e-dce9-497d-bac8-767c3d571b48',
                settings: JSON.stringify({ players, mapId: randNumber[0] }),
            },
        });
    };

    return (
        <Container>
            <Row className="justify-content-center">
                <Form
                    onSubmit={(event) => newStart(event)}
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        textAlign: 'left',
                        backgroundColor: 'white',
                        padding: '15px',
                    }}
                >
                    <h3>Новая игра</h3>
                    <div className="settings">
                        <div
                            className="player"
                            onClick={() => changePlayer(0)}
                            style={{
                                top: '200px',
                                left: '100px',
                                backgroundImage: `url(${getUrlByPlayer(players[0])})`,
                            }}
                        ></div>
                        <div
                            className="player"
                            onClick={() => changePlayer(1)}
                            style={{
                                top: '100px',
                                left: '0px',
                                backgroundImage: `url(${getUrlByPlayer(players[1])})`,
                            }}
                        ></div>
                        <div
                            className="player"
                            onClick={() => changePlayer(2)}
                            style={{
                                top: '0px',
                                left: '100px',
                                backgroundImage: `url(${getUrlByPlayer(players[2])})`,
                            }}
                        ></div>
                        <div
                            className="player"
                            onClick={() => changePlayer(3)}
                            style={{
                                top: '100px',
                                left: '200px',
                                backgroundImage: `url(${getUrlByPlayer(players[3])})`,
                            }}
                        ></div>
                    </div>
                    <Form.Control
                        type="hidden"
                        name="players"
                        value={players}
                    />
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Код карты</Form.Label>
                        <Form.Control
                            type="text"
                            name="mapcode"
                            placeholder="Введите код"
                            value={randNumber[0]}
                            onChange={(event) => {
                                let clone = new Uint32Array(1);
                                clone[0] = Number(event.target.value);
                                setRandNumber(clone);
                            }}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Начать
                    </Button>
                </Form>
            </Row>
        </Container>
    );
}

export default Newgame;
