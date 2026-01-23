import { TFunction } from "i18next";
import { z } from "zod";

export const makeZodErrorMap =
  (t: TFunction): z.ZodErrorMap =>
  (issue, ctx) => {
    let message: string;
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        message = t("validation.invalid_type", {
          expected: String(issue.expected),
          received: String(issue.received),
        });
        break;
      case z.ZodIssueCode.too_small:
        if (issue.type === "string")
          message = t("validation.min.string", {
            count: Number(issue.minimum),
          });
        else message = ctx.defaultError;
        break;
      case z.ZodIssueCode.too_big:
        if (issue.type === "string")
          message = t("validation.max.string", {
            count: Number(issue.maximum),
          });
        else message = ctx.defaultError;
        break;
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") message = t("validation.email");
        else message = ctx.defaultError;
        break;
      default:
        message = ctx.defaultError;
    }
    return { message };
  };
