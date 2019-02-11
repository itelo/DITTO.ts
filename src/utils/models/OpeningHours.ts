import { Request } from "express";
import mongoose from "mongoose";
import { middleware } from "express-paginate";
import Store, { StoreModel } from "@models/store.model";
import dateFns, {
  differenceInMinutes,
  getDay,
  getHours,
  getMinutes
} from "date-fns";
import _flatten from "lodash/flatten";
export function getOpenStores(store: StoreModel[]) {
  const openHours: number[] = [];
  const now = calculateTime(new Date());
  const openingHours = store.map(({ opening_hours }) => {
    return isStoreOpen(opening_hours, now);
  });
  // console.log(store);

  return openingHours;
}

export function isStoreOpen(opening_hours: [string, string][], now: number) {
  const day = 24;
  const hours = 60;
  const openHours = [];

  for (let index = 0; index < opening_hours.length; index++) {
    for (let index2 = 0; index2 < opening_hours[index].length; index2++) {
      const [hour, minutes] = opening_hours[index][index2].split(":");
      const openingHours =
        parseInt(hour) * hours + parseInt(minutes) + index * day * hours;

      openHours.push(openingHours);
    }
  }

  for (let index = 1; index <= openHours.length - 1; index += 2) {
    if (openHours[index] < openHours[index - 1]) {
      openHours[index] = openHours[index] + day * hours;
    }
  }

  const maxTimeOnAWeek = day * hours * 7;
  const binaryResult = binarySearch(openHours, now);
  if (binaryResult) {
    // console.log(120 < openHours[openHours.length - 1]);

    return binaryResult;
  }
  if (!binaryResult && openHours[openHours.length - 1] > maxTimeOnAWeek) {
    openHours[openHours.length - 1] -= maxTimeOnAWeek;

    return now < openHours[openHours.length - 1];
  }

  return false;
}

export function binarySearch(openHours: number[], timeNow: number) {
  let start = 0;
  let stop = openHours.length - 1;
  let middle = Math.floor((start + stop) / 2);

  // While the middle is not what we're looking for and the openHours does not have a single item
  while (openHours[middle] !== timeNow && start < stop) {
    if (timeNow < openHours[middle]) {
      stop = middle - 1;
    } else {
      start = middle + 1;
    }

    // recalculate middle on every iteration
    middle = Math.floor((start + stop) / 2);
  }

  // if the current middle item is what we're looking for return it's index, else return -1
  // return (openHours[middle] <= timeNow ) ? true : false;
  if (timeNow <= openHours[middle] && timeNow >= start) {
    return true;
  } else {
    return false;
  }
}

export function calculateTime(today: Date) {
  const todaysDay = getDay(today);

  const todaysHours = getHours(today);

  const todaysMinutes = getMinutes(today);

  const timeNow = todaysDay * 24 * 60 + (todaysHours * 60 + todaysMinutes);

  return timeNow;
}
