import os
from typing import Optional

import databases

import ormar
import sqlalchemy

DATABASE_URL = os.environ.get('DATABASE_URL', "sqlite:///db.sqlite")
metadata = sqlalchemy.MetaData()
database = databases.Database(DATABASE_URL)
engine = sqlalchemy.create_engine(DATABASE_URL)


print(DATABASE_URL)


class BaseMeta(ormar.ModelMeta):
    metadata = metadata
    database = database


class Game(ormar.Model):
    class Meta(BaseMeta):
        tablename = "games"

    uuid: int = ormar.UUID(primary_key=True)
    host: Optional[str] = ormar.String(max_length=100, nullable=True)
    player: Optional[str] = ormar.String(max_length=100, nullable=True)
    host_front: Optional[bool] = ormar.Boolean(nullable=True)
    host_back: Optional[bool] = ormar.Boolean(nullable=True)


async def create_game(uuid, host):
    return await Game.objects.create(uuid=uuid, host=host)


def create_db():
    metadata.create_all(engine)

def drop_db():
    metadata.drop_all(engine)
