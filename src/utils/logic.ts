import { CardInfo } from '../data/cards';
import { Orientation } from '../data/types';

export function rotateCardInfo(
  cardInfo: CardInfo,
  orientation: Orientation
): CardInfo {
  if (orientation === Orientation.NORTH) {
    return cardInfo;
  }

  switch (orientation) {
    case Orientation.EAST:
      return {
        ...cardInfo,
        sides: [
          cardInfo.sides[3],
          cardInfo.sides[0],
          cardInfo.sides[1],
          cardInfo.sides[2],
        ],
        connects: [
          cardInfo.connects[3],
          cardInfo.connects[0],
          cardInfo.connects[1],
          cardInfo.connects[2],
        ],
      };
    case Orientation.SOUTH:
      return {
        ...cardInfo,
        sides: [
          cardInfo.sides[2],
          cardInfo.sides[3],
          cardInfo.sides[0],
          cardInfo.sides[1],
        ],
        connects: [
          cardInfo.connects[2],
          cardInfo.connects[3],
          cardInfo.connects[0],
          cardInfo.connects[1],
        ],
      };
    case Orientation.WEST:
      return {
        ...cardInfo,
        sides: [
          cardInfo.sides[1],
          cardInfo.sides[2],
          cardInfo.sides[3],
          cardInfo.sides[0],
        ],
        connects: [
          cardInfo.connects[1],
          cardInfo.connects[2],
          cardInfo.connects[3],
          cardInfo.connects[0],
        ],
      };
  }
}
